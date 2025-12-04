
import { redirect } from "next/navigation";

export default function Home() {
  redirect('/cms/landing-page')
  return (
  <div>
    hello
  </div>
  );
}
