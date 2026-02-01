// BlockQuest - Terms and Conditions Screen
// Australian Consumer Law Compliant
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CRT_COLORS } from '../src/constants/crtTheme';

const LAST_UPDATED = 'February 1, 2025';
const COMPANY_EMAIL = 'blockquestofficial@gmail.com';
const COMPANY_WEBSITE = 'https://blockquestofficial.com';

export default function TermsAndConditions() {
  const router = useRouter();

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${COMPANY_EMAIL}`);
  };

  const handleWebsitePress = () => {
    Linking.openURL(COMPANY_WEBSITE);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={CRT_COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Logo/Brand Section */}
        <View style={styles.brandSection}>
          <Text style={styles.brandName}>🎮 BLOCKQUEST</Text>
          <Text style={styles.brandSubtitle}>Terms and Conditions of Use</Text>
          <Text style={styles.lastUpdated}>Last Updated: {LAST_UPDATED}</Text>
          <View style={styles.australianBadge}>
            <Text style={styles.australianText}>🇦🇺 Proudly Australian Made</Text>
          </View>
        </View>

        {/* Agreement */}
        <Section title="1. Agreement to Terms">
          <Paragraph>
            Welcome to BlockQuest ("we," "us," "our"), an Australian-owned and operated mobile gaming application. By accessing or using BlockQuest (the "Service"), you agree to be bound by these Terms and Conditions.
          </Paragraph>
          <Highlight>
            If you do not agree with these terms, please do not use the Service. For users under 18, a parent or guardian must review and accept these terms on your behalf.
          </Highlight>
          <Paragraph>
            BlockQuest is operated from Australia and these Terms are governed by Australian law, including the Australian Consumer Law (ACL).
          </Paragraph>
        </Section>

        {/* Eligibility */}
        <Section title="2. Eligibility">
          <Paragraph>
            BlockQuest is designed as a family-friendly gaming platform suitable for all ages. To use certain features:
          </Paragraph>
          <BulletPoint>Guest Mode: Available to all users without age restrictions</BulletPoint>
          <BulletPoint>Registered Accounts: Users under 13 require parental consent</BulletPoint>
          <BulletPoint>Cloud Sync: Requires a valid email address</BulletPoint>
          <Paragraph>
            Parents and guardians are responsible for monitoring their children's use of the Service.
          </Paragraph>
        </Section>

        {/* Account Terms */}
        <Section title="3. Account Registration">
          <Paragraph>
            When creating an account, you agree to:
          </Paragraph>
          <BulletPoint>Provide accurate and truthful information</BulletPoint>
          <BulletPoint>Maintain the security of your password</BulletPoint>
          <BulletPoint>Not share your account with others</BulletPoint>
          <BulletPoint>Notify us immediately of any unauthorised access</BulletPoint>
          <Paragraph>
            You are responsible for all activity that occurs under your account. We reserve the right to suspend or terminate accounts that violate these terms.
          </Paragraph>
        </Section>

        {/* Acceptable Use */}
        <Section title="4. Acceptable Use Policy">
          <Paragraph>
            When using BlockQuest, you agree NOT to:
          </Paragraph>
          <BulletPoint color={CRT_COLORS.accentRed}>❌ Use offensive, inappropriate, or vulgar usernames</BulletPoint>
          <BulletPoint color={CRT_COLORS.accentRed}>❌ Attempt to hack, exploit, or cheat in games</BulletPoint>
          <BulletPoint color={CRT_COLORS.accentRed}>❌ Harass, bully, or harm other users</BulletPoint>
          <BulletPoint color={CRT_COLORS.accentRed}>❌ Upload malicious content or viruses</BulletPoint>
          <BulletPoint color={CRT_COLORS.accentRed}>❌ Use automated scripts or bots</BulletPoint>
          <BulletPoint color={CRT_COLORS.accentRed}>❌ Reverse engineer or copy the Service</BulletPoint>
          <BulletPoint color={CRT_COLORS.accentRed}>❌ Use the Service for any illegal purpose</BulletPoint>
          <Paragraph>
            Violation of these rules may result in immediate account termination.
          </Paragraph>
        </Section>

        {/* Intellectual Property */}
        <Section title="5. Intellectual Property">
          <Paragraph>
            All content in BlockQuest, including but not limited to:
          </Paragraph>
          <BulletPoint>Game designs, graphics, and artwork</BulletPoint>
          <BulletPoint>Music, sound effects, and audio</BulletPoint>
          <BulletPoint>Code, software, and algorithms</BulletPoint>
          <BulletPoint>Logos, trademarks, and branding</BulletPoint>
          <BulletPoint>Text, documentation, and tutorials</BulletPoint>
          <Paragraph>
            are owned by BlockQuest Official or its licensors and protected by Australian and international copyright laws. You may not reproduce, distribute, or create derivative works without our express written permission.
          </Paragraph>
        </Section>

        {/* User Content */}
        <Section title="6. User-Generated Content">
          <Paragraph>
            By submitting content to BlockQuest (such as usernames, avatar selections, or leaderboard entries), you:
          </Paragraph>
          <BulletPoint>Grant us a non-exclusive, royalty-free licence to display your username on leaderboards</BulletPoint>
          <BulletPoint>Confirm your content does not infringe any third-party rights</BulletPoint>
          <BulletPoint>Accept that we may remove content that violates our policies</BulletPoint>
          <Paragraph>
            You retain ownership of any original content you create, subject to the licence granted above.
          </Paragraph>
        </Section>

        {/* Game Progress */}
        <Section title="7. Game Progress & Virtual Items">
          <Paragraph>
            BlockQuest includes virtual achievements, badges, and game progress. You acknowledge that:
          </Paragraph>
          <BulletPoint>Virtual items have no real-world monetary value</BulletPoint>
          <BulletPoint>Badges and achievements are for entertainment only</BulletPoint>
          <BulletPoint>We may modify or reset game systems at any time</BulletPoint>
          <BulletPoint>Progress may be lost due to technical issues</BulletPoint>
          <Highlight>
            BlockQuest is completely free to play with no in-app purchases or paid content.
          </Highlight>
        </Section>

        {/* Australian Consumer Law */}
        <Section title="8. Australian Consumer Guarantees">
          <Paragraph>
            Under the Australian Consumer Law (ACL), you have certain rights that cannot be excluded. Our goods and services come with guarantees that cannot be excluded under the ACL.
          </Paragraph>
          <Paragraph>
            For major failures with the Service, you are entitled to:
          </Paragraph>
          <BulletPoint>Cancel your account and receive a refund for any paid services (if applicable)</BulletPoint>
          <BulletPoint>Compensation for any reasonably foreseeable loss or damage</BulletPoint>
          <Paragraph>
            For minor failures, you are entitled to have problems corrected in a reasonable time.
          </Paragraph>
          <Highlight>
            Nothing in these terms excludes, restricts, or modifies any consumer guarantee, right, or remedy conferred by the ACL that cannot be excluded, restricted, or modified.
          </Highlight>
        </Section>

        {/* Limitation of Liability */}
        <Section title="9. Limitation of Liability">
          <Paragraph>
            To the maximum extent permitted by Australian law, and subject to your Australian Consumer Law rights:
          </Paragraph>
          <BulletPoint>The Service is provided "as is" without warranties of any kind</BulletPoint>
          <BulletPoint>We do not guarantee uninterrupted or error-free service</BulletPoint>
          <BulletPoint>We are not liable for any indirect, incidental, or consequential damages</BulletPoint>
          <BulletPoint>Our total liability is limited to the amount you paid us (which is $0 for this free app)</BulletPoint>
          <Paragraph>
            These limitations do not apply to liability that cannot be excluded under Australian law.
          </Paragraph>
        </Section>

        {/* Privacy */}
        <Section title="10. Privacy">
          <Paragraph>
            Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which forms part of these Terms.
          </Paragraph>
          <Paragraph>
            We comply with the Australian Privacy Principles (APPs) under the Privacy Act 1988 (Cth) and the Children's Online Privacy Protection Act (COPPA) for international users.
          </Paragraph>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={styles.linkText}>📜 View our Privacy Policy</Text>
          </TouchableOpacity>
        </Section>

        {/* Modifications */}
        <Section title="11. Changes to Terms">
          <Paragraph>
            We may update these Terms from time to time. When we make significant changes:
          </Paragraph>
          <BulletPoint>We will update the "Last Updated" date</BulletPoint>
          <BulletPoint>We will notify users through the app</BulletPoint>
          <BulletPoint>Continued use constitutes acceptance of new terms</BulletPoint>
          <Paragraph>
            We encourage you to review these Terms periodically.
          </Paragraph>
        </Section>

        {/* Termination */}
        <Section title="12. Termination">
          <Paragraph>
            You may stop using the Service at any time. We may suspend or terminate your access if you:
          </Paragraph>
          <BulletPoint>Violate these Terms and Conditions</BulletPoint>
          <BulletPoint>Engage in fraudulent or illegal activity</BulletPoint>
          <BulletPoint>Abuse other users or our systems</BulletPoint>
          <Paragraph>
            Upon termination, your right to use the Service ceases immediately. We may delete your account data in accordance with our Privacy Policy.
          </Paragraph>
        </Section>

        {/* Dispute Resolution */}
        <Section title="13. Dispute Resolution">
          <Paragraph>
            If you have a dispute with us, we encourage you to contact us first to seek resolution. We will try to resolve your concern promptly and fairly.
          </Paragraph>
          <Paragraph>
            If we cannot resolve the dispute informally, you agree that:
          </Paragraph>
          <BulletPoint>Any legal proceedings will be conducted in Australian courts</BulletPoint>
          <BulletPoint>Australian law governs these Terms</BulletPoint>
          <BulletPoint>You submit to the jurisdiction of courts in Queensland, Australia</BulletPoint>
        </Section>

        {/* Governing Law */}
        <Section title="14. Governing Law">
          <Paragraph>
            These Terms are governed by the laws of Queensland, Australia. Any disputes will be resolved in accordance with Australian law, including:
          </Paragraph>
          <BulletPoint>Australian Consumer Law (ACL)</BulletPoint>
          <BulletPoint>Privacy Act 1988 (Cth)</BulletPoint>
          <BulletPoint>Competition and Consumer Act 2010 (Cth)</BulletPoint>
        </Section>

        {/* Severability */}
        <Section title="15. Severability">
          <Paragraph>
            If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
          </Paragraph>
        </Section>

        {/* Contact Us */}
        <Section title="16. Contact Us">
          <Paragraph>
            If you have any questions about these Terms and Conditions, please contact us:
          </Paragraph>
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>📧 Email</Text>
            <TouchableOpacity onPress={handleEmailPress}>
              <Text style={styles.contactLink}>{COMPANY_EMAIL}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>🌐 Website</Text>
            <TouchableOpacity onPress={handleWebsitePress}>
              <Text style={styles.contactLink}>{COMPANY_WEBSITE}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>🏢 BlockQuest Official</Text>
            <Text style={styles.contactText}>Queensland, Australia</Text>
          </View>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerEmoji}>🎮🇦🇺🕹️</Text>
          <Text style={styles.footerText}>
            "Building the future, one block at a time"
          </Text>
          <Text style={styles.copyright}>
            © 2025 BlockQuest Official. All rights reserved.
          </Text>
          <Text style={styles.australianMade}>
            🦘 Proudly Made in Australia 🦘
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
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 12,
  },
  australianBadge: {
    marginTop: 12,
    backgroundColor: CRT_COLORS.accentGold + '20',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CRT_COLORS.accentGold + '40',
  },
  australianText: {
    fontSize: 12,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: CRT_COLORS.textSecondary,
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
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
    lineHeight: 20,
  },
  highlightBox: {
    backgroundColor: CRT_COLORS.accentCyan + '15',
    borderLeftWidth: 3,
    borderLeftColor: CRT_COLORS.accentCyan,
    padding: 12,
    marginVertical: 12,
    borderRadius: 4,
  },
  highlightText: {
    fontSize: 14,
    color: CRT_COLORS.accentCyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: CRT_COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textDecorationLine: 'underline',
    marginTop: 8,
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
    color: CRT_COLORS.textSecondary,
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
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  copyright: {
    fontSize: 11,
    color: CRT_COLORS.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  australianMade: {
    fontSize: 11,
    color: CRT_COLORS.accentGold,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 8,
  },
});
