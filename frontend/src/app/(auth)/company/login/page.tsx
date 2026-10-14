import { redirect } from 'next/navigation';

export default function CompanyLoginPage() {
  redirect('/?role=company&mode=login#access');
}
