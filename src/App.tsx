import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { LanguageProvider } from "./lib/i18n";
import { AuthProvider } from "./lib/auth";
import { CartProvider, setAttribution } from "./lib/shop";
import { ToastProvider, ConfirmProvider, ZoneBoot, hostZone } from "./lib/shell";
import { initNotifyEngine } from "./lib/notify";

/** Boots the central Email + Telegram + Dashboard notification engine. */
function NotificationBoot() {
  useEffect(() => {
    initNotifyEngine();
  }, []);
  return null;
}
import { Header, Footer, FloatingActions, MobileBottomNav, ScrollToTop } from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Career from "./pages/Career";
import Shop from "./pages/Shop";
import ClientDashboard, { PortalLogin, PortalRegister } from "./pages/ClientPortal";
import AffiliateDashboard from "./pages/AffiliatePortal";
import Admin from "./pages/Admin";
import {
  ServicesOverview,
  WebDevPage,
  SoftwarePage,
  HostingPage,
} from "./pages/ServicePages";
import {
  EducationPage,
  OnlineServicesPage,
  CitizenPage,
  GraphicPage,
  MarketingPage,
} from "./pages/ServicePages2";
import { ProductsPage, PortfolioPage, CoursesPage } from "./pages/ProductsPortfolio";
import { FaqPage, VerifyPage, PrivacyPage, TermsPage, NotFoundPage } from "./pages/MiscPages";
import AppointmentPage from "./pages/Appointment";

/** Captures ?ref= affiliate codes anywhere on the site. */
function AttributionCapture() {
  const [params] = useSearchParams();
  useEffect(() => {
    const ref = params.get("ref");
    if (ref) {
      setAttribution(ref);
      import("./lib/affiliate").then(({ trackClick }) => trackClick(ref, "site"));
    }
  }, [params]);
  return null;
}

/** Renewal reminders + auto-renewal + expiry checks (run on load). */
function RenewalMonitor() {
  useEffect(() => {
    import("./lib/db").then(({ all, update, notify, getSettings, where }) => {
      const settings = getSettings();
      const days = settings.renewalNotifyDays || [7, 3, 1];
      all("subscriptions").forEach((s) => {
        if (s.status === "cancelled") return;
        const next = new Date(s.next_renewal).getTime();
        const diffDays = Math.ceil((next - Date.now()) / 86400000);
        if (diffDays < 0) {
          if (s.auto_renew) {
            // Auto-renew from wallet if balance is sufficient
            import("./lib/affiliate").then(({ renewSubscription }) => {
              import("./lib/db").then(({ walletBalance }) => {
                const price = s.renewal_price || s.price;
                if (walletBalance(s.user_id) >= price) {
                  const r = renewSubscription(s.id, "wallet");
                  if (r.ok && (r as any).order?.status !== "pending_payment") {
                    notify(s.user_id, "order", { en: "Auto-renewal successful", bn: "অটো-রিনিউ সফল হয়েছে" }, {
                      en: `Your ${typeof s.name === "string" ? s.name : s.name?.en} subscription was auto-renewed from your wallet.`,
                      bn: `আপনার ${typeof s.name === "string" ? s.name : s.name?.bn} সাবস্ক্রিপশন ওয়ালেট থেকে অটো-রিনিউ হয়েছে।`,
                    });
                    return;
                  }
                }
                update("subscriptions", s.id, { status: "expired" });
              });
            });
          } else {
            update("subscriptions", s.id, { status: "expired" });
          }
          notify(s.user_id, "order", { en: "Subscription expired", bn: "সাবস্ক্রিপশনের মেয়াদ শেষ" }, {
            en: `Your ${typeof s.name === "string" ? s.name : s.name?.en} subscription has expired. Renew to continue.`,
            bn: `আপনার ${typeof s.name === "string" ? s.name : s.name?.bn} সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে। চালিয়ে যেতে নবায়ন করুন।`,
          });
        } else if (days.includes(diffDays)) {
          const key = `rnw_${s.id}_${diffDays}`;
          if (where("notifications", (n) => n.kind === key).length === 0) {
            notify(s.user_id, key, { en: `Renewal due in ${diffDays} day(s)`, bn: `${diffDays} দিনের মধ্যে নবায়ন প্রয়োজন` }, {
              en: `Your ${typeof s.name === "string" ? s.name : s.name?.en} renews soon (৳${s.renewal_price}).`,
              bn: `আপনার ${typeof s.name === "string" ? s.name : s.name?.bn} শিগগিরই নবায়ন করতে হবে (৳${s.renewal_price})।`,
            });
          }
        }
      });
    });
  }, []);
  return null;
}

export default function App() {
  const zone = hostZone();
  const isSubdomain = zone !== "public";
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <ConfirmProvider>
              <HashRouter>
                <ScrollToTop />
                <ZoneBoot />
                <NotificationBoot />
                <AttributionCapture />
                <RenewalMonitor />
                <div className="flex min-h-screen flex-col">
                  {isSubdomain ? (
                    /* Subdomain zones have no public site shell */
                    <main className="flex-1" id="main-content">
                      <Routes>
                        <Route path="/portal/login" element={<PortalLogin />} />
                        <Route path="/portal/register" element={<PortalRegister />} />
                        <Route path="/portal/dashboard" element={<ClientDashboard />} />
                        <Route path="/portal/affiliate" element={<AffiliateDashboard />} />
                        <Route path="/portal/affiliate/kyc" element={<AffiliateDashboard />} />
                        <Route path="/portal/*" element={<Navigate to="/portal/dashboard" replace />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
                        <Route path="/*" element={<Navigate to={zone === "portal" ? "/portal/dashboard" : "/admin"} replace />} />
                      </Routes>
                    </main>
                  ) : (
                    /* Public website with full shell + portal/admin zones on hash paths */
                    <>
                      <Header />
                      <main className="flex-1" id="main-content">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/services" element={<ServicesOverview />} />
                          <Route path="/services/web-development" element={<WebDevPage />} />
                          <Route path="/services/software-development" element={<SoftwarePage />} />
                          <Route path="/services/education-management" element={<EducationPage />} />
                          <Route path="/services/online-services" element={<OnlineServicesPage />} />
                          <Route path="/services/citizen-services" element={<CitizenPage />} />
                          <Route path="/services/domain-hosting" element={<HostingPage />} />
                          <Route path="/services/graphic-design" element={<GraphicPage />} />
                          <Route path="/services/digital-marketing" element={<MarketingPage />} />
                          <Route path="/products" element={<ProductsPage />} />
                          <Route path="/portfolio" element={<PortfolioPage />} />
                          <Route path="/courses" element={<CoursesPage />} />
                          <Route path="/career" element={<Career />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/faq" element={<FaqPage />} />
                          <Route path="/verify-certificate" element={<VerifyPage />} />
                          <Route path="/privacy-policy" element={<PrivacyPage />} />
                          <Route path="/terms" element={<TermsPage />} />
                          <Route path="/shop" element={<Shop />} />
                          <Route path="/appointment" element={<AppointmentPage />} />
                          {/* Portal zone (my.alkhubaibit.com) */}
                          <Route path="/portal/login" element={<PortalLogin />} />
                          <Route path="/portal/register" element={<PortalRegister />} />
                          <Route path="/portal/dashboard" element={<ClientDashboard />} />
                          <Route path="/portal/affiliate" element={<AffiliateDashboard />} />
                          <Route path="/portal/affiliate/kyc" element={<AffiliateDashboard />} />
                          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
                          {/* Admin zone (admin.alkhubaibit.com) */}
                          <Route path="/admin" element={<Admin />} />
                          {/* Legacy redirects */}
                          <Route path="/login" element={<Navigate to="/portal/login" replace />} />
                          <Route path="/register" element={<Navigate to="/portal/register" replace />} />
                          <Route path="/dashboard" element={<Navigate to="/portal/dashboard" replace />} />
                          <Route path="/affiliate" element={<Navigate to="/portal/affiliate" replace />} />
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </main>
                      <Footer />
                      <FloatingActions />
                      <MobileBottomNav />
                    </>
                  )}
                </div>
              </HashRouter>
            </ConfirmProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
