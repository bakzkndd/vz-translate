import React, { memo, useState } from "react";
import { Modal, FormTitle, Button } from "@vizality/components";
import { SelectInput } from "@vizality/components/settings";
import { close } from "@vizality/modal";

export default memo(
  ({
    getSetting,
    updateSetting,
    languageSelectList,
    This,
    forceUpdate,
    updateTooltip,
  }) => {
    const [from, setFrom] = useState(getSetting("from-language", -1));
    const [to, setTo] = useState(getSetting("to-language", 0));

    return (
      <Modal size={Modal.Sizes.MEDIUM}>
        <Modal.Header>
          <FormTitle tag="h4">vz-translate language selection</FormTitle>
          <Modal.CloseButton
            onClick={() => {
              close();
              if (This && forceUpdate) forceUpdate(This);
            }}
          />
        </Modal.Header>
        <Modal.Content className="vz-translate-modal-content">
          <div>
            <SelectInput
              value={from}
              options={[{ value: -1, label: "Auto" }, ...languageSelectList]}
              onChange={(res) => {
                if (to != res.value) {
                  updateSetting("from-language", res.value);
                  setFrom(res.value);
                }
              }}
            >
              From:
            </SelectInput>
            <SelectInput
              value={to}
              options={languageSelectList}
              onChange={(res) => {
                if (from != res.value) {
                  updateSetting("to-language", res.value);
                  setTo(res.value);
                }
              }}
            >
              To:
            </SelectInput>
          </div>
        </Modal.Content>
        <span className="vz-translate-modal-warning">
          You can't have both the From and To values set to the same value.
          Trying to will simply not change anything!
        </span>
        <Modal.Footer>
          <Button
            size={Button.Sizes.MEDIUM}
            color={Button.Colors.BRAND}
            look={Button.Looks.FILLED}
            onClick={() => {
              close();
              if (This && forceUpdate) forceUpdate(This);
            }}
          >
            Done
          </Button>
          <span style={{ width: "5px" }} />
          <span className="vz-translate-modal-warning vz-translate-modal-warning-second">
            Don't click outside the modal to close it!
          </span>
        </Modal.Footer>
      </Modal>
    );
  }
);
