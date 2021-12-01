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
  }

  render() {
    let getSetting = this.get;
    let updateSetting = this.set;

    return (
      <>
        <Tooltip
          text={`Translate Text ${
            !this.languageNames[getSetting("from-language", -1)]
              ? ""
              : `From ${this.languageNames[getSetting("from-language", -1)]}`
          } To ${this.languageNames[getSetting("to-language", 0)]}`}
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

                // sets your message to the output
                if (output) currentText = output;
                if (currentText.length >= 3)
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
            <div className="contents-18-Yxp button-3AYNKb button-318s1X translate-menu">
              <svg className="buttonWrapper-1ZmCpA" width="32px" height="32px">
                <g transform="translate(0, -4.4), scale(0.4)">
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
              </svg>
            </div>
          </Button>
        </Tooltip>
      </>
    );
  }
};
