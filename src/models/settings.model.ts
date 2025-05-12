import { Column, PrimaryGeneratedColumn } from "typeorm";

export class SettingsModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "site_name", nullable: true })
  siteName?: string;

  @Column({ name: "site_email_owner", nullable: true })
  siteEmailOwner?: string;

  @Column({ name: "site_country", nullable: true })
  siteCountry?: string;

  @Column({ name: "site_language", nullable: true })
  siteLanguage?: string;

  @Column({ name: "site_currency", nullable: true })
  siteCurrency?: string;

  @Column({ name: "site_phone_number", nullable: true })
  sitePhoneNumber?: string;

  @Column({ name: "site_logo", nullable: true })
  siteLogo?: string;

  @Column({ name: "site_favicon", nullable: true })
  siteFavicon?: string;

  @Column({ name: "twak_code", nullable: true })
  twakCode?: string;

  @Column({ name: "live_chat_enabled", default: false })
  liveChatEnabled?: boolean;

  // facebook app id
  @Column({ name: "facebook_app_id", nullable: true })
  facebookAppId?: string;

  // facebook app secret
  @Column({ name: "facebook_app_secret", nullable: true })
  facebookAppSecret?: string;

  // apple app id
  @Column({ name: "apple_app_id", nullable: true })
  appleAppId?: string;

  //brevo api key
  @Column({ name: "brevo_api_key", nullable: true })
  brevoApiKey?: string;

  //brevo list id
  @Column({ name: "brevo_list_id", nullable: true })
  brevoListId?: string;

  //Microsoft Text Translator
  @Column({ name: "microsoft_text_translator_key", nullable: true })
  microsoftTextTranslatorKey?: string;

  //Google Analytics Key
  @Column({ name: "google_analytics_key", nullable: true })
  googleAnalyticsKey?: string;

  //Google Analytics Client JSON
  @Column({ name: "google_analytics_client_json", nullable: true })
  googleAnalyticsClientJson?: string;

  //Google Recaptcha
  @Column({ name: "google_recaptcha_key", nullable: true })
  googleRecaptchaKey?: string;

  //Google Recaptcha Secret
  @Column({ name: "google_recaptcha_secret", nullable: true })
  googleRecaptchaSecret?: string;

  //Google Client JSON
  @Column({ name: "google_client_json", nullable: true })
  googleClientJson?: string;

  @Column({ name: "google_api_key", nullable: true })
  googleApiKey?: string;

  //Firebase Server Key
  @Column({ name: "firebase_server_key", nullable: true })
  firebaseServerKey?: string;
}
