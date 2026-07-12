import { PolicyPage } from "../components/PolicyPage";

export default function CopyrightPage() {
  return <PolicyPage title="Copyright and content complaints">
    <p>Paperlog indexes bibliographic metadata and links readers to publisher, DOI, arXiv, and open-access locations. It does not host research-paper PDFs in this alpha.</p>
    <h2>User submissions</h2><p>Users must own or have permission to publish their submitted material. Reader notes should summarize papers in the user’s own words and use only limited attributed quotation where lawful.</p>
    <h2>Requesting review or removal</h2><p>Submit a copyright request through the <a href="/contact">contact form</a> with the copyrighted work, the exact Paperlog URL, the challenged material, your contact information, and a statement explaining your authority and good-faith belief. Paperlog may remove or restrict material while reviewing a complete request.</p>
    <h2>Corrections and counter-information</h2><p>Users affected by a removal may submit relevant authorization or other counter-information through the same form. Repeated infringement may result in participation restrictions.</p>
  </PolicyPage>;
}
