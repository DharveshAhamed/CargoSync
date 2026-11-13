import { redirect } from 'next/navigation';

export default function AdminRegisterPage() {
  redirect('/?role=admin&mode=login#access');
}
