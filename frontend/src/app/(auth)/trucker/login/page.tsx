import { redirect } from 'next/navigation';

export default function TruckerLoginPage() {
  redirect('/?role=trucker&mode=login#access');
}
