import { redirect } from 'next/navigation'

export default function DirectoryPage() {
    // Redirect to the Services page which is the local services directory
    redirect('/services')
}
