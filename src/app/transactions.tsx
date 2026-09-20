import { ScreenFrame } from '@/components/screen-frame';
import { StateMessage } from '@/components/state-message';

export default function TransactionsScreen() {
  return (
    <ScreenFrame title="Transactions" description="See your financial events.">
      <StateMessage
        kind="empty"
        title="No transactions yet"
        message="Transactions you record will appear here."
      />
    </ScreenFrame>
  );
}
