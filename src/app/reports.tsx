import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';

export default function ReportsScreen() {
  return (
    <ScreenFrame title="Reports" description="Understand where your money went.">
      <StateMessage
        kind="empty"
        title="No report available yet"
        message="Reports will appear here after you record transactions."
      />
    </ScreenFrame>
  );
}
