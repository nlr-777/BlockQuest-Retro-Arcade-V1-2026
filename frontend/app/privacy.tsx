// BlockQuest - Privacy Policy Screen
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CRT_COLORS } from '../src/constants/crtTheme';

const LAST_UPDATED = 'February 1, 2025';
const COMPANY_EMAIL = 'privacy@blockquest.game';

export default function PrivacyPolicy() {
  const router = useRouter();

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${COMPANY_EMAIL}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CRT_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandName}>🎮 BLOCKQUEST</Text>
          <Text style={styles.brandSubtitle}>Retro Arcade Hub</Text>
          <Text style={styles.lastUpdated}>Last Updated: {LAST_UPDATED}</Text>
        </View>

        {/* Introduction */}
        <Section title="1. Introduction">
          <Paragraph>
            Welcome to BlockQuest ("we," "our," or "us"). We are committed to protecting your privacy and ensuring a safe gaming experience for all players, especially our younger audience.
          </Paragraph>
          <Paragraph>
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our BlockQuest mobile application and related services (collectively, the "Service").
          </Paragraph>
          <Highlight>
            BlockQuest is designed to be kid-friendly and family-safe. We take extra precautions to protect the privacy of children under 13.
          </Highlight>
        </Section>

        {/* Information We Collect */}
        <Section title="2. Information We Collect">
          <SubSection title="2.1 Information You Provide">
            <BulletPoint>Account registration details (username, email, password)</BulletPoint>
            <BulletPoint>Profile customization choices (avatar selection)</BulletPoint>
            <BulletPoint>Game progress and high scores</BulletPoint>
            <BulletPoint>Achievement badges earned</BulletPoint>
            <BulletPoint>Faction/DAO membership preferences</BulletPoint>
          </SubSection>

          <SubSection title="2.2 Information Collected Automatically">
            <BulletPoint>Device information (device type, operating system)</BulletPoint>
            <BulletPoint>Game play statistics and session duration</BulletPoint>
            <BulletPoint>App performance data for improvements</BulletPoint>
            <BulletPoint>Error logs for debugging purposes</BulletPoint>
          </SubSection>

          <SubSection title="2.3 Information We Do NOT Collect">
            <BulletPoint color={CRT_COLORS.primary}>❌ Precise location data</BulletPoint>
            <BulletPoint color={CRT_COLORS.primary}>❌ Contact lists or phone numbers</BulletPoint>
            <BulletPoint color={CRT_COLORS.primary}>❌ Photos or camera access</BulletPoint>
            <BulletPoint color={CRT_COLORS.primary}>❌ Financial or payment information</BulletPoint>
            <BulletPoint color={CRT_COLORS.primary}>❌ Voice recordings or microphone data</BulletPoint>
          </SubSection>
        </Section>

        {/* How We Use Information */}
        <Section title="3. How We Use Your Information">
          <Paragraph>We use the information we collect to:</Paragraph>
          <BulletPoint>Provide and maintain the Service</BulletPoint>
          <BulletPoint>Save your game progress across devices</BulletPoint>
          <BulletPoint>Display leaderboards and achievements</BulletPoint>
          <BulletPoint>Improve and optimize game performance</BulletPoint>
          <BulletPoint>Respond to your inquiries and support requests</BulletPoint>
          <BulletPoint>Send important updates about the Service (with consent)</BulletPoint>
        </Section>

        {/* Data Storage */}
        <Section title="4. Data Storage & Security">
          <Paragraph>
            Your data is stored securely using industry-standard encryption. Game progress can be stored locally on your device (Guest Mode) or synced to our cloud servers (Registered Users).
          </Paragraph>
          <SubSection title="Security Measures">
            <BulletPoint>🔒 JWT token-based authentication</BulletPoint>
            <BulletPoint>🔒 Encrypted password storage (bcrypt)</BulletPoint>
            <BulletPoint>🔒 Input sanitization to prevent attacks</BulletPoint>
            <BulletPoint>🔒 Rate limiting to prevent abuse</BulletPoint>
            <BulletPoint>🔒 HTTPS encryption for all data transfers</BulletPoint>
          </SubSection>
        </Section>

        {/* Children's Privacy (COPPA) */}
        <Section title="5. Children's Privacy (COPPA Compliance)">
          <Highlight>
            BlockQuest is designed for all ages and takes children's privacy seriously.
          </Highlight>
          <Paragraph>
            We comply with the Children's Online Privacy Protection Act (COPPA). For users under 13:
          </Paragraph>
          <BulletPoint>We do not require personal information to play as a guest</BulletPoint>
          <BulletPoint>We do not collect more information than necessary</BulletPoint>
          <BulletPoint>We do not share children's data with third parties for marketing</BulletPoint>
          <BulletPoint>Parents can request deletion of their child's data at any time</BulletPoint>
          <Paragraph>
            If you are a parent and believe your child has provided personal information without your consent, please contact us immediately at {COMPANY_EMAIL}.
          </Paragraph>
        </Section>

        {/* Third-Party Services */}
        <Section title="6. Third-Party Services">
          <Paragraph>
            BlockQuest may use the following third-party services:
          </Paragraph>
          <BulletPoint>Google Sign-In (optional authentication)</BulletPoint>
          <BulletPoint>DiceBear (avatar generation - no personal data shared)</BulletPoint>
          <BulletPoint>Expo/React Native (app framework)</BulletPoint>
          <Paragraph>
            Each third-party service has its own privacy policy. We encourage you to review their policies.
          </Paragraph>
        </Section>

        {/* Data Retention */}
        <Section title="7. Data Retention">
          <Paragraph>
            We retain your data for as long as your account is active or as needed to provide the Service. You can request deletion of your account and data at any time.
          </Paragraph>
          <SubSection title="Retention Periods">
            <BulletPoint>Account data: Until account deletion</BulletPoint>
            <BulletPoint>Game progress: Until account deletion</BulletPoint>
            <BulletPoint>Leaderboard entries: Until account deletion</BulletPoint>
            <BulletPoint>Error logs: 30 days maximum</BulletPoint>
          </SubSection>
        </Section>

        {/* Your Rights */}
        <Section title="8. Your Rights">
          <Paragraph>You have the right to:</Paragraph>
          <BulletPoint>Access your personal data</BulletPoint>
          <BulletPoint>Correct inaccurate data</BulletPoint>
          <BulletPoint>Delete your account and data</BulletPoint>
          <BulletPoint>Export your game data</BulletPoint>
          <BulletPoint>Opt-out of non-essential communications</BulletPoint>
          <Paragraph>
            To exercise these rights, please contact us at {COMPANY_EMAIL} or use the "Delete Account" option in the app settings.
          </Paragraph>
        </Section>

        {/* International Users */}
        <Section title="9. International Users (GDPR)">
          <Paragraph>
            For users in the European Economic Area (EEA), we process your data based on:
          </Paragraph>
          <BulletPoint>Your consent (for optional features)</BulletPoint>
          <BulletPoint>Contract performance (to provide the Service)</BulletPoint>
          <BulletPoint>Legitimate interests (to improve the Service)</BulletPoint>
          <Paragraph>
            You have additional rights under GDPR including data portability and the right to lodge a complaint with a supervisory authority.
          </Paragraph>
        </Section>

        {/* Changes to Policy */}
        <Section title="10. Changes to This Policy">
          <Paragraph>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting the new Privacy Policy in the app and updating the "Last Updated" date.
          </Paragraph>
          <Paragraph>
            Your continued use of the Service after changes constitutes acceptance of the updated policy.
          </Paragraph>
        </Section>

        {/* Contact Us */}
        <Section title="11. Contact Us">
          <Paragraph>
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </Paragraph>
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>📧 Email</Text>
            <TouchableOpacity onPress={handleEmailPress}>
              <Text style={styles.contactLink}>{COMPANY_EMAIL}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>🏢 BlockQuest Games</Text>
            <Text style={styles.contactText}>Privacy Team</Text>
          </View>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerEmoji}>🎮⛓️🕹️</Text>
          <Text style={styles.footerText}>
            "Building the future, one block at a time"
          </Text>
          <Text style={styles.copyright}>
            © 2025 BlockQuest. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Components
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.subSection}>
    <Text style={styles.subSectionTitle}>{title}</Text>
    {children}
  </View>
);

const Paragraph = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.paragraph}>{children}</Text>
);

const BulletPoint = ({ children, color }: { children: React.ReactNode; color?: string }) => (
  <View style={styles.bulletContainer}>
    <Text style={[styles.bullet, color ? { color } : {}]}>•</Text>
    <Text style={[styles.bulletText, color ? { color } : {}]}>{children}</Text>
  </View>
);

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.highlightBox}>
    <Text style={styles.highlightText}>{children}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CRT_COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.bgMedium,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  brandSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: CRT_COLORS.bgMedium,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CRT_COLORS.accentYellow,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  subSection: {
    marginTop: 12,
    marginLeft: 8,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  bulletText: {
    fontSize: 14,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
    lineHeight: 20,
  },
  highlightBox: {
    backgroundColor: CRT_COLORS.primary + '20',
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.primary,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
  },
  highlightText: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    lineHeight: 20,
  },
  contactBox: {
    backgroundColor: CRT_COLORS.bgMedium,
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CRT_COLORS.textBright,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 13,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  contactLink: {
    fontSize: 13,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: CRT_COLORS.bgMedium,
    marginTop: 16,
    marginBottom: 40,
  },
  footerEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,  // Brightened for kids
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
