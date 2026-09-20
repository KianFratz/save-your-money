import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';

export default function HomeScreen() {
  return (
    <ScreenFrame title="Home" description="Your money, at a glance.">
      <StateMessage
        kind="empty"
        title="Nothing to show yet"
        message="Your monthly overview will appear here when you start planning."
      />
    </ScreenFrame>
  );
}
