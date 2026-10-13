import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Header from '../../components/Header';
import LoadingState from '../../components/LoadingState';
import { companyService } from '../../services/companyService';

export const CompanyProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [address, setAddress] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const data = await companyService.getProfile();
        if (data) {
          setName(data.name || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          setGstin(data.gstin || '');
          setPan(data.pan || '');
          setState(data.state || '');
          setCity(data.city || '');
          setPincode(data.pincode || '');
          setAddress(data.address || '');
          setInvoicePrefix(data.invoice_prefix || 'INV');
        }
      } catch (err) {
        console.warn('Company profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setFormError('Business name is required');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      await companyService.setupCompany({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        gstin: gstin.trim().toUpperCase() || undefined,
        pan: pan.trim().toUpperCase() || undefined,
        state: state.trim() || undefined,
        city: city.trim() || undefined,
        pincode: pincode.trim() || undefined,
        address: address.trim() || undefined,
        invoice_prefix: invoicePrefix.trim().toUpperCase() || 'INV',
      });

      Alert.alert('Success', 'Business profile updated successfully!');
      navigation.goBack();
    } catch (err) {
      setFormError(err.message || 'Failed to update company profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading business profile..." fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Company Profile"
        subtitle="Business & GST Information"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Input
            label="Business Name *"
            placeholder="e.g. Green Leaf Agencies"
            value={name}
            onChangeText={setName}
            error={formError}
          />

          <Input
            label="Business Phone"
            placeholder="9876543210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Business Email"
            placeholder="contact@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <Input
                label="GSTIN"
                placeholder="33AAAAA0000A1Z5"
                value={gstin}
                onChangeText={(t) => setGstin(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={15}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="PAN Number"
                placeholder="ABCDE1234F"
                value={pan}
                onChangeText={(t) => setPan(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={10}
              />
            </View>
          </View>

          <Input
            label="State / Union Territory"
            placeholder="e.g. Tamil Nadu"
            value={state}
            onChangeText={setState}
          />

          <View style={styles.rowInputs}>
            <View style={{ flex: 1, marginRight: SPACING.sm }}>
              <Input
                label="City"
                placeholder="e.g. Coimbatore"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Pincode"
                placeholder="641001"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <Input
            label="Registered Address"
            placeholder="Complete shop / office address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />

          <Input
            label="Invoice Prefix"
            placeholder="INV"
            value={invoicePrefix}
            onChangeText={(t) => setInvoicePrefix(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
            helper="Appears on bills: e.g. INV-000001"
          />

          <Button
            title={saving ? 'Saving...' : 'Save Profile'}
            onPress={handleSave}
            loading={saving}
            size="md"
            style={{ marginTop: SPACING.lg }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  card: {
    padding: SPACING.xl,
  },
  rowInputs: {
    flexDirection: 'row',
  },
});

export default CompanyProfileScreen;
