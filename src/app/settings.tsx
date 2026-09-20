import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';

export default function SettingsScreen() {
  return (
    <ScreenFrame title="Settings" description="Keep your money data under your control.">
      <StateMessage
        kind="warning"
        title="Your data stays on this device"
        message="This app works offline and needs no account. A portable backup will be needed to move your data to another device."
      />
    </ScreenFrame>
  );
}
