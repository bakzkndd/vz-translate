import { Plugin } from "@vizality/entities";
import { getModule } from "@vizality/webpack";
import { patch, unpatch } from "@vizality/patcher";
import { get, request } from "https";
import { findInReactTree } from "@vizality/util/react";
import { React } from "@vizality/webpack";
import TextContainerButton from "./components/TextContainerButton";
import { ContextMenu } from "@vizality/components";
import Modal from "./components/Modal.jsx";
import translate from "./translate.min.js";
import { open } from "@vizality/modal";

const translateAPI = "https://libretranslate.de";

function doGet(url) {
  return new Promise((resolve, reject) => {
    get(
      url,
      {
        rejectUnauthorized: false,
        strictSSL: false,
      },
      (res) => {
        let responseBody = "";

        res.on("data", (chunk) => {
          responseBody += chunk;
        });

        res.on("end", () => {
          resolve(JSON.parse(responseBody));
        });
      }
    );
  });
}

function doRequest(url, data, body) {
  return new Promise((resolve, reject) => {
    const req = request(url, data, (res) => {
      let responseBody = "";

      res.on("data", (chunk) => {
        responseBody += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(responseBody)[0].language);
      });
    });
    req.write(body);
    req.end();
  });
}

export default class TranslateVZ extends Plugin {
  async start() {
    this.injectStyles("./style.css");

    this.languages = await doGet(`https://libretranslate.com/languages`);
    this.languages.sort(function (a, b) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
    this.injectChatButton();
    this.injectMessageContextButton();
  }

  injectChatButton() {
    const ChannelTextAreaContainer = getModule(
      (m) =>
        m.type &&
        m.type.render &&
        m.type.render.displayName === "ChannelTextAreaContainer",
      false
    );
    patch(
      "chat-button",
      ChannelTextAreaContainer.type,
      "render",
      (args, res) => {
        const props = findInReactTree(
          res,
          (r) => r && r.className && r.className.indexOf("buttons-") == 0
        );
        props.children.unshift(
          <TextContainerButton
            settings={this.settings}
            translateAPI={translateAPI}
            languages={this.languages}
          />
        );

        return res;
      }
    );
    ChannelTextAreaContainer.type.render.displayName =
      "ChannelTextAreaContainer";
  }

  injectMessageContextButton() {
    const MessageContextMenu = getModule(
      (m) => m?.default?.displayName === "MessageContextMenu"
    );
    const { MenuSeparator } = getModule("MenuItem");

    this.get = this.settings.get;
    this.set = this.settings.set;
    this.translateAPI = translateAPI;

    this.languageCodes = [];
    this.languageNames = [];
    this.languageSelectList = [];
    for (let i = 0; i < this.languages.length; i++) {
      this.languageCodes.push(this.languages[i].code);
      this.languageNames.push(this.languages[i].name);
      this.languageSelectList.push({ value: i, label: this.languages[i].name });
    }
    let getSetting = this.get;
    let updateSetting = this.set;

    patch(
      "MessageContextMenu-Button",
      MessageContextMenu,
      "default",
      ([{ message }], { props }) => {
        console.log(message);
        console.log(props);
        this.message = message;
        // Add items
        props.children.push(
          <>
            <MenuSeparator />
            <ContextMenu.Group label="VZ-Translate">
              <ContextMenu.Item
                id={`toggle-button enabled`}
                label={`Translate text to ${
                  this.languageNames[getSetting("to-language", 0)]
                }`}
                action={async () => {
                  /* Inject Toggle Button */
                  let currentText = message.content;

                  if (
                    !currentText.startsWith("/") &&
                    currentText &&
                    currentText != "\n"
                  ) {
                    console.log(currentText);

                    // shit with output here
                    let data = {
                      to: this.languageCodes[getSetting("to-language", 0)],
                    };
                    data.from = await doRequest(
                      `${this.translateAPI}/detect`,
                      {
                        method: "POST",
                        rejectUnauthorized: false,
                        strictSSL: false,
                        headers: {
                          accept: "application/json",
                          "Content-Type": "application/json",
                        },
                      },
                      JSON.stringify({
                        q: currentText,
                      })
                    );
                    console.log(data);

                    translate.url = this.translateAPI;

                    let output = await translate(currentText, data);
                    console.log(output);
                    // sets your message to the output
                    if (output) currentText = output;

                    console.log(currentText);

                    document.getElementById(
                      `message-content-${message.id}`
                    ).innerHTML = currentText;
                  }
                }}
              />
              <ContextMenu.Item
                id="change-language"
                label="Change Language"
                action={async () => {
                  {
                    open(() => (
                      <Modal
                        getSetting={getSetting}
                        updateSetting={updateSetting}
                        languageSelectList={this.languageSelectList}
                      />
                    ));
                  }
                }}
              />
            </ContextMenu.Group>
          </>
        );
      }
    );
  }

  stop() {
    unpatch("chat-button");
    unpatch("MessageContextMenu-Button");
  }
}
