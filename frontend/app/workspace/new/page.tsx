// /workspace/new redirects to /workspace
// The create domain modal is triggered there
import { redirect } from 'next/navigation';

export default function NewWorkspacePage() {
  redirect('/workspace?create=1');
}
