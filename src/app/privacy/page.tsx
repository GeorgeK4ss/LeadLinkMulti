import { PublicLayout } from "@/components/layout/PublicLayout";

export const metadata = {
  title: "Privacy Policy - LeadLink CRM",
  description: "LeadLink CRM Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="container py-16 md:py-20">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: April 5, 2024</p>
          </div>

          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">1. Introduction</h2>
              <p className="text-muted-foreground">
                LeadLink Inc. ("us", "we", or "our") operates the LeadLink CRM application (the "Service").
              </p>
              <p className="text-muted-foreground">
                This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
              </p>
              <p className="text-muted-foreground">
                We use your data to provide and improve the Service. By using the Service, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">2. Information Collection and Use</h2>
              <p className="text-muted-foreground">
                We collect several different types of information for various purposes to provide and improve our Service to you.
              </p>

              <h3 className="text-xl font-bold">Types of Data Collected</h3>
              
              <h4 className="text-lg font-bold">Personal Data</h4>
              <p className="text-muted-foreground">
                While using our Service, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you ("Personal Data"). Personally identifiable information may include, but is not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Phone number</li>
                <li>Company name</li>
                <li>Address, State, Province, ZIP/Postal code, City</li>
                <li>Cookies and Usage Data</li>
              </ul>

              <h4 className="text-lg font-bold">Usage Data</h4>
              <p className="text-muted-foreground">
                We may also collect information on how the Service is accessed and used ("Usage Data"). This Usage Data may include information such as your computer's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
              </p>

              <h4 className="text-lg font-bold">Tracking & Cookies Data</h4>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to track the activity on our Service and hold certain information.
              </p>
              <p className="text-muted-foreground">
                Cookies are files with small amount of data which may include an anonymous unique identifier. Cookies are sent to your browser from a website and stored on your device. Tracking technologies also used are beacons, tags, and scripts to collect and track information and to improve and analyze our Service.
              </p>
              <p className="text-muted-foreground">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
              </p>
              <p className="text-muted-foreground">
                Examples of Cookies we use:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Session Cookies.</strong> We use Session Cookies to operate our Service.</li>
                <li><strong>Preference Cookies.</strong> We use Preference Cookies to remember your preferences and various settings.</li>
                <li><strong>Security Cookies.</strong> We use Security Cookies for security purposes.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">3. Use of Data</h2>
              <p className="text-muted-foreground">
                LeadLink Inc. uses the collected data for various purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>To provide and maintain the Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                <li>To provide customer care and support</li>
                <li>To provide analysis or valuable information so that we can improve the Service</li>
                <li>To monitor the usage of the Service</li>
                <li>To detect, prevent and address technical issues</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">4. Transfer of Data</h2>
              <p className="text-muted-foreground">
                Your information, including Personal Data, may be transferred to — and maintained on — computers located outside of your state, province, country or other governmental jurisdiction where the data protection laws may differ than those from your jurisdiction.
              </p>
              <p className="text-muted-foreground">
                If you are located outside United States and choose to provide information to us, please note that we transfer the data, including Personal Data, to United States and process it there.
              </p>
              <p className="text-muted-foreground">
                Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
              </p>
              <p className="text-muted-foreground">
                LeadLink Inc. will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this Privacy Policy and no transfer of your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of your data and other personal information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold">5. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>By email: privacy@leadlink.com</li>
                <li>By mail: 123 CRM Street, San Francisco, CA 94103, United States</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
} 