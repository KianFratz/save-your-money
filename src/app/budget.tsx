import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';

export default function BudgetScreen() {
  return (
    <ScreenFrame title="Budget" description="Plan this calendar month.">
      <StateMessage
        kind="empty"
        title="No monthly budget yet"
        message="Your Needs, Wants, and Savings plan will appear here."
      />
    </ScreenFrame>
  );
}
