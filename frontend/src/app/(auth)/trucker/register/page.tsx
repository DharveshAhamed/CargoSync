import { redirect } from 'next/navigation';

export default function TruckerRegisterPage() {
  redirect('/?role=trucker&mode=register#access');
}
