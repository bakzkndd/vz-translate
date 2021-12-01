import { Plugin } from "@vizality/entities";
import { getModule, getModuleByPrototypes } from "@vizality/webpack";
import { patch, unpatch } from "@vizality/patcher";
import { get, request } from "https";
import { findInReactTree } from "@vizality/util/react";
import { React } from "@vizality/webpack";
import TextContainerButton from "./components/TextContainerButton";
import { Icon } from "@vizality/components";
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

    this.get = this.settings.get;
    this.set = this.settings.set;
    this.translateAPI = translateAPI;

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

    this.languageCodes = [];
    this.languageNames = [];
    this.languageSelectList = [];
    for (let i = 0; i < this.languages.length; i++) {
      this.languageCodes.push(this.languages[i].code);
      this.languageNames.push(this.languages[i].name);
      this.languageSelectList.push({ value: i, label: this.languages[i].name });
    }

    this.injectChatButton();
    this.injectMessageContextButton();
    this.injectMessageHoverButton();
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
    const { MenuSeparator, MenuItem } = getModule("MenuItem");

    let getSetting = this.get;
    let updateSetting = this.set;
    patch(
      "MessageContextMenu-Button",
      MessageContextMenu,
      "default",
      ([{ message }], { props }) => {
        this.message = message;

        // Add items
        props.children.push(
          <>
            <MenuSeparator />
            <MenuItem
              id={`translate`}
              label={`Translate Text To ${
                this.languageNames[getSetting("to-language", 0)]
              }`}
              color={MenuItem.Colors.DEFAULT}
              action={async () => {
                this.translateText(this.message);
              }}
            />
            <MenuItem
              id="change-language"
              label="Change Translation Language"
              color={MenuItem.Colors.DEFAULT}
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
          </>
        );
      }
    );
  }

  injectMessageHoverButton() {
    let getSetting = this.get;
    let updateSetting = this.set;
    const MiniPopover = getModule(
      (m) => m?.default?.displayName === "MiniPopover"
    );
    const ToolTip = getModuleByPrototypes(["renderTooltip"]);

    patch("Message-Hover-Translate", MiniPopover, "default", (res) => {
      if (!Boolean(res[0].children[res[0].children.length - 1]?.props?.message))
        return;

      const ele = res[0].children[res[0].children.length - 1];
      const { message } = ele.props;
      const origType = ele.type;

      ele.type = () => {
        const popUp = origType(ele.props);
        if (!popUp?.props?.children) return popUp;

        // Add button
        popUp.props.children.splice(
          popUp.props.children.length - 2,
          0,
          <ToolTip text={`Translate Text`}>
            {(TtProps) => (
              <MiniPopover.Button
                {...TtProps}
                className="translate-hover-menu-button"
                key="translate"
                onClick={(e) => {
                  TtProps.onClick(e);
                  this.translateText(message);
                }}
                onContextMenu={() => {
                  open(() => (
                    <Modal
                      getSetting={getSetting}
                      updateSetting={updateSetting}
                      languageSelectList={this.languageSelectList}
                    />
                  ));
                }}
              >
                {" "}
                <svg className="button-1ZiXG9" width="32px" height="32px">
                  <g transform="translate(0, -4.4), scale(0.37)">
                    <path
                      fill="currentColor"
                      transform="translate(-4,-4.4)"
                      d="m 46.4,52.6 c -4.2,-4.1 -7.9,-7.7 -10,-16 H 51.1 V 30.4 H 36.5 v -8.2 h -6.3 v 8.3 H 15.5 v 6.2 h 15 c 0,0 -0.1,1.2 -0.3,2.1 -2.1,8.2 -4.6,13.4 -14.7,18.5 l 2.1,6.2 C 27.2,58.4 32.2,52 34.4,44.9 c 2.1,5.4 5.7,9.8 9.8,13.8 l 2.2,-6.1 z"
                    />
                    <path
                      fill="currentColor"
                      transform="translate(-4,-4.4)"
                      d="M 65.8,32.5 H 57.4 L 42.7,73.8 H 49 L 53.2,61.4 H 70 l 4.2,12.4 h 6.3 L 65.8,32.5 z m -10.5,22.7 6.3,-16.5 6.3,16.6 -12.6,-0.1 0,0 z"
                    />
                  </g>
                </svg>{" "}
              </MiniPopover.Button>
            )}
          </ToolTip>
        );

        return popUp;
      };
    });
  }

  async translateText(message) {
    let getSetting = this.get;
    let updateSetting = this.set;
    /* Inject Toggle Button */
    let currentText = message.content;

    if (!currentText.startsWith("/") && currentText && currentText != "\n") {
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

      document.getElementById(`message-content-${message.id}`).innerHTML =
        currentText;
    }
  }

  stop() {
    unpatch("chat-button");
    unpatch("MessageContextMenu-Button");
    unpatch("Message-Hover-Translate");
  }
}
