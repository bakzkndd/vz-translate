import { React, getModule } from "@vizality/webpack";
import { Tooltip, Button } from "@vizality/components";
import translate from "../translate.min.js";
import { open } from "@vizality/modal";
import { request } from "https";

import Modal from "./Modal";

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

module.exports = class TextContainerButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.get = this.props.settings.get;
    this.set = this.props.settings.set;
    this.translateAPI = this.props.translateAPI;

    this.languages = this.props.languages;
    this.languageCodes = [];
    this.languageNames = [];
    this.languageSelectList = [];
    for (let i = 0; i < this.languages.length; i++) {
      this.languageCodes.push(this.languages[i].code);
      this.languageNames.push(this.languages[i].name);
      this.languageSelectList.push({ value: i, label: this.languages[i].name });
    }

    console.log(this.languages);
    console.log(this.languageNames);
    console.log(this.languageSelectList);
  }

  render() {
    let getSetting = this.get;
    let updateSetting = this.set;

    return (
      <>
        <Tooltip
          text={`Translate text ${
            !this.languageNames[getSetting("from-language", -1)]
              ? ""
              : `from ${this.languageNames[getSetting("from-language", -1)]}`
          } to ${this.languageNames[getSetting("to-language", 0)]}`}
          position="top"
        >
          <Button
            className={`toggle-button enabled`}
            look={Button.Looks.BLANK}
            size={Button.Sizes.ICON}
            onClick={async () => {
              /* Inject Button */
              let currentText = document.getElementsByClassName(
                "markup-2BOw-j slateTextArea-1Mkdgw fontSize16Padding-3Wk7zP"
              )[0].outerText;

              let channelLink = document.getElementsByClassName(
                "markup-2BOw-j slateTextArea-1Mkdgw fontSize16Padding-3Wk7zP"
              )[0].baseURI;
              let channelLinkArray = channelLink.split("/");
              let channelId = channelLinkArray[channelLinkArray.length - 1];

              if (
                !currentText.startsWith("/") &&
                currentText &&
                currentText != "\n"
              ) {
                // shit with output here
                let data = {
                  to: this.languageCodes[getSetting("to-language", 0)],
                };
                if (getSetting("from-language", -1) >= 0) {
                  data.from =
                    this.languageCodes[getSetting("from-language", -1)];
                } else
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

                translate.url = this.translateAPI;

                let output = await translate(currentText, data);
                console.log(output);
                // sets your message to the output
                if (output) currentText = output;

                getModule("sendMessage").sendMessage(
                  channelId,
                  {
                    content: currentText,
                    invalidEmojis: [],
                    tts: false,
                    validNonShortcutEmojis: [],
                  },
                  undefined,
                  {}
                );
              }
            }}
            onContextMenu={async () => {
              function forceUpdate(This) {
                This.forceUpdate();
              }
              open(() => (
                <Modal
                  getSetting={getSetting}
                  updateSetting={updateSetting}
                  languageSelectList={this.languageSelectList}
                  This={this}
                  forceUpdate={forceUpdate}
                />
              ));
            }}
          >
            <div className="contents-18-Yxp button-3AYNKb button-318s1X">
              <svg className="buttonWrapper-1ZmCpA" width="24px" height="24px">
                <polygon
                  fill="currentColor"
                  transform="translate(-4,-4.4), scale(0.9)"
                  points="21.1059,7.71462 10.3929,18.4277 18.4277,26.4625 26.4624,18.4277 23.7842,15.7494 18.4277,21.106 15.7494,18.4277 23.7841,10.3929 31.819,18.4277 18.4277,31.8191 5.03626,18.4277 18.4277,5.03633 "
                />
              </svg>
            </div>
          </Button>
        </Tooltip>
      </>
    );
  }
};
