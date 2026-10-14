import { redirect } from 'next/navigation';

export default function CompanyRegisterPage() {
  redirect('/?role=company&mode=register#access');
}
