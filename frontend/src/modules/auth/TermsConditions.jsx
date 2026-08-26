import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Check, Globe } from 'lucide-react';
import api from '../../utils/api';
import { updateUser } from '../../redux/authSlice';
import Button from '../../components/Button';

const TermsConditions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('en');

  const content = {
    en: {
      title: 'Terms & Conditions',
      p1: 'By using GoBill, users agree to the following terms:',
      p2: 'GoBill is a billing and invoice management software that helps users create business bills and invoices, manage customer information, and track billing records and reports.',
      p3: 'The bills, invoices, tax, GST, and other business information generated through GoBill are based on the information entered by the user. Users are responsible for ensuring that all information provided and generated is accurate and complete.',
      p4: 'Users should verify prices, GST, taxes, customer details, and other business information before issuing or using any invoice generated through GoBill.',
      p5: 'GoBill is a billing and invoice management platform only and does not provide professional tax, legal, accounting, or financial advice.',
      p6: 'Subscription plans and usage limits are subject to the applicable plan selected by the user. Basic and Pro plans have their respective monthly bill-generation limits and features.',
      p7: 'Users must not misuse the service, bypass subscription limits, or access another user\'s account without authorization.',
      p8: 'GoBill may update its features, pricing, usage limits, or these Terms & Conditions from time to time.',
      p9: 'By continuing to use GoBill and entering the dashboard, you confirm that you have read, understood, and agreed to these Terms & Conditions.',
      agree: 'I Agree to the Terms & Conditions',
      continue: 'I Agree & Continue'
    },
    ta: {
      title: 'விதிமுறைகள் மற்றும் நிபந்தனைகள்',
      p1: 'GoBill ஐப் பயன்படுத்துவதன் மூலம், பயனர்கள் பின்வரும் விதிமுறைகளுக்கு ஒப்புக்கொள்கிறார்கள்:',
      p2: 'GoBill என்பது வணிக பில்கள் மற்றும் இன்வாய்ஸ்களை உருவாக்க, வாடிக்கையாளர் தகவல்களை நிர்வகிக்க, மற்றும் பில்லிங் பதிவுகள் மற்றும் அறிக்கைகளைக் கண்காணிக்க உதவும் ஒரு பில்லிங் மற்றும் இன்வாய்ஸ் மேலாண்மை மென்பொருளாகும்.',
      p3: 'GoBill மூலம் உருவாக்கப்படும் பில்கள், இன்வாய்ஸ்கள், வரி, GST மற்றும் பிற வணிகத் தகவல்கள் பயனர் உள்ளிடும் தகவல்களின் அடிப்படையிலானவை. வழங்கப்பட்ட மற்றும் உருவாக்கப்பட்ட அனைத்து தகவல்களும் துல்லியமானவை மற்றும் முழுமையானவை என்பதை உறுதி செய்வதற்கு பயனர்களே பொறுப்பாவார்கள்.',
      p4: 'GoBill மூலம் உருவாக்கப்பட்ட எந்தவொரு இன்வாய்ஸையும் வழங்குவதற்கு அல்லது பயன்படுத்துவதற்கு முன்பு பயனர்கள் விலைகள், GST, வரிகள், வாடிக்கையாளர் விவரங்கள் மற்றும் பிற வணிகத் தகவல்களைச் சரிபார்க்க வேண்டும்.',
      p5: 'GoBill என்பது ஒரு பில்லிங் மற்றும் இன்வாய்ஸ் மேலாண்மை தளம் மட்டுமே மற்றும் இது தொழில்முறை வரி, சட்ட, கணக்கியல் அல்லது நிதி ஆலோசனைகளை வழங்காது.',
      p6: 'சந்தா திட்டங்கள் மற்றும் பயன்பாட்டு வரம்புகள் பயனர் தேர்ந்தெடுத்த பொருந்தக்கூடிய திட்டத்திற்கு உட்பட்டவை. Basic மற்றும் Pro திட்டங்கள் அவற்றின் தொடர்புடைய மாதாந்திர பில்-உருவாக்க வரம்புகள் மற்றும் அம்சங்களைக் கொண்டுள்ளன.',
      p7: 'பயனர்கள் சேவையை தவறாகப் பயன்படுத்தக்கூடாது, சந்தா வரம்புகளைத் தவிர்க்கக்கூடாது, அல்லது அங்கீகாரம் இல்லாமல் மற்றொரு பயனரின் கணக்கை அணுகக்கூடாது.',
      p8: 'GoBill அதன் அம்சங்கள், விலை நிர்ணயம், பயன்பாட்டு வரம்புகள் அல்லது இந்த விதிமுறைகள் மற்றும் நிபந்தனைகளை அவ்வப்போது புதுப்பிக்கலாம்.',
      p9: 'GoBill ஐ தொடர்ந்து பயன்படுத்துவதன் மூலமும், டாஷ்போர்டில் நுழைவதன் மூலமும், இந்த விதிமுறைகள் மற்றும் நிபந்தனைகளைப் படித்து, புரிந்துகொண்டு, ஒப்புக்கொண்டீர்கள் என்பதை உறுதிப்படுத்துகிறீர்கள்.',
      agree: 'விதிமுறைகள் மற்றும் நிபந்தனைகளை நான் ஏற்கிறேன்',
      continue: 'நான் ஏற்கிறேன் & தொடர்கிறேன்'
    },
    hi: {
      title: 'नियम और शर्तें',
      p1: 'GoBill का उपयोग करके, उपयोगकर्ता निम्नलिखित शर्तों से सहमत होते हैं:',
      p2: 'GoBill एक बिलिंग और चालान प्रबंधन सॉफ्टवेयर है जो उपयोगकर्ताओं को व्यावसायिक बिल और चालान बनाने, ग्राहक जानकारी प्रबंधित करने, और बिलिंग रिकॉर्ड और रिपोर्ट ट्रैक करने में मदद करता है।',
      p3: 'GoBill के माध्यम से उत्पन्न बिल, चालान, कर, GST, और अन्य व्यावसायिक जानकारी उपयोगकर्ता द्वारा दर्ज की गई जानकारी पर आधारित हैं। सभी प्रदान की गई और उत्पन्न जानकारी सटीक और पूर्ण है यह सुनिश्चित करने के लिए उपयोगकर्ता जिम्मेदार हैं।',
      p4: 'GoBill के माध्यम से उत्पन्न किसी भी चालान को जारी करने या उपयोग करने से पहले उपयोगकर्ताओं को कीमतों, GST, करों, ग्राहक विवरण, और अन्य व्यावसायिक जानकारी को सत्यापित करना चाहिए।',
      p5: 'GoBill केवल एक बिलिंग और चालान प्रबंधन मंच है और यह पेशेवर कर, कानूनी, लेखा, या वित्तीय सलाह प्रदान नहीं करता है।',
      p6: 'सदस्यता योजनाएं और उपयोग सीमाएं उपयोगकर्ता द्वारा चुनी गई लागू योजना के अधीन हैं। Basic और Pro योजनाओं की अपनी संबंधित मासिक बिल-उत्पादन सीमाएं और विशेषताएं हैं।',
      p7: 'उपयोगकर्ताओं को सेवा का दुरुपयोग नहीं करना चाहिए, सदस्यता सीमाओं को बायपास नहीं करना चाहिए, या बिना प्राधिकरण के किसी अन्य उपयोगकर्ता के खाते तक नहीं पहुंचना चाहिए।',
      p8: 'GoBill समय-समय पर अपनी विशेषताओं, मूल्य निर्धारण, उपयोग सीमाओं, या इन नियमों और शर्तों को अपडेट कर सकता है।',
      p9: 'GoBill का उपयोग जारी रखकर और डैशबोर्ड में प्रवेश करके, आप पुष्टि करते हैं कि आपने इन नियमों और शर्तों को पढ़, समझ लिया है, और सहमत हो गए हैं।',
      agree: 'मैं नियमों और शर्तों से सहमत हूँ',
      continue: 'मैं सहमत हूँ और जारी रखें'
    },
    ml: {
      title: 'നിബന്ധനകളും വ്യവസ്ഥകളും',
      p1: 'GoBill ഉപയോഗിക്കുന്നതിലൂടെ, ഉപയോക്താക്കൾ ഇനിപ്പറയുന്ന വ്യവസ്ഥകൾ അംഗീകരിക്കുന്നു:',
      p2: 'ബിസിനസ്സ് ബില്ലുകളും ഇൻവോയ്‌സുകളും സൃഷ്ടിക്കാനും ഉപഭോക്തൃ വിവരങ്ങൾ കൈകാര്യം ചെയ്യാനും ബില്ലിംഗ് രേഖകളും റിപ്പോർട്ടുകളും ട്രാക്കുചെയ്യാനും ഉപയോക്താക്കളെ സഹായിക്കുന്ന ഒരു ബില്ലിംഗ് ആൻഡ് ഇൻവോയ്‌സ് മാനേജ്‌മെന്റ് സോഫ്റ്റ്‌വെയറാണ് GoBill.',
      p3: 'GoBill വഴി സൃഷ്ടിക്കുന്ന ബില്ലുകൾ, ഇൻവോയ്‌സുകൾ, നികുതി, GST, മറ്റ് ബിസിനസ്സ് വിവരങ്ങൾ എന്നിവ ഉപയോക്താവ് നൽകിയ വിവരങ്ങളെ അടിസ്ഥാനമാക്കിയുള്ളതാണ്. നൽകിയതും സൃഷ്ടിച്ചതുമായ എല്ലാ വിവരങ്ങളും കൃത്യവും പൂർണ്ണവുമാണെന്ന് ഉറപ്പാക്കാൻ ഉപയോക്താക്കൾക്ക് ഉത്തരവാദിത്തമുണ്ട്.',
      p4: 'GoBill വഴി സൃഷ്ടിച്ച ഏതെങ്കിലും ഇൻവോയ്‌സ് നൽകുന്നതിനോ ഉപയോഗിക്കുന്നതിനോ മുമ്പായി ഉപയോക്താക്കൾ വിലകൾ, GST, നികുതികൾ, ഉപഭോക്തൃ വിശദാംശങ്ങൾ, മറ്റ് ബിസിനസ്സ് വിവരങ്ങൾ എന്നിവ പരിശോധിക്കേണ്ടതാണ്.',
      p5: 'GoBill ഒരു ബില്ലിംഗ് ആൻഡ് ഇൻവോയ്‌സ് മാനേജ്‌മെന്റ് പ്ലാറ്റ്‌ഫോം മാത്രമാണ്, ഇത് പ്രൊഫഷണൽ നികുതി, നിയമ, അക്കൗണ്ടിംഗ്, അല്ലെങ്കിൽ സാമ്പത്തിക ഉപദേശം നൽകുന്നില്ല.',
      p6: 'സബ്‌സ്‌ക്രിപ്‌ഷൻ പ്ലാനുകളും ഉപയോഗ പരിധികളും ഉപയോക്താവ് തിരഞ്ഞെടുത്ത ബാധകമായ പ്ലാനിന് വിധേയമാണ്. Basic, Pro പ്ലാനുകൾക്ക് അവരുടേതായ പ്രതിമാസ ബിൽ-ജനറേഷൻ പരിധികളും സവിശേഷതകളും ഉണ്ട്.',
      p7: 'ഉപയോക്താക്കൾ സേവനം ദുരുപയോഗം ചെയ്യുകയോ സബ്‌സ്‌ക്രിപ്‌ഷൻ പരിധികൾ മറികടക്കുകയോ അംഗീകാരമില്ലാതെ മറ്റൊരു ഉപയോക്താവിന്റെ അക്കൗണ്ട് ആക്‌സസ് ചെയ്യുകയോ ചെയ്യരുത്.',
      p8: 'GoBill-ന് അതിന്റെ സവിശേഷതകൾ, വിലനിർണ്ണയം, ഉപയോഗ പരിധികൾ, അല്ലെങ്കിൽ ഈ നിബന്ധനകളും വ്യവസ്ഥകളും കാലാകാലങ്ങളിൽ അപ്‌ഡേറ്റ് ചെയ്തേക്കാം.',
      p9: 'GoBill ഉപയോഗിക്കുന്നത് തുടരുന്നതിലൂടെയും ഡാഷ്‌ബോർഡിൽ പ്രവേശിക്കുന്നതിലൂടെയും, നിങ്ങൾ ഈ നിബന്ധനകളും വ്യവസ്ഥകളും വായിച്ച് മനസ്സിലാക്കി അംഗീകരിച്ചുവെന്ന് സ്ഥിരീകരിക്കുന്നു.',
      agree: 'നിബന്ധനകളും വ്യവസ്ഥകളും ഞാൻ അംഗീകരിക്കുന്നു',
      continue: 'ഞാൻ അംഗീകരിക്കുന്നു & തുടരുക'
    },
    kn: {
      title: 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
      p1: 'GoBill ಅನ್ನು ಬಳಸುವ ಮೂಲಕ, ಬಳಕೆದಾರರು ಈ ಕೆಳಗಿನ ನಿಯಮಗಳಿಗೆ ಸಮ್ಮತಿಸುತ್ತಾರೆ:',
      p2: 'GoBill ಎನ್ನುವುದು ವ್ಯಾಪಾರ ಬಿಲ್‌ಗಳು ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್‌ಗಳನ್ನು ರಚಿಸಲು, ಗ್ರಾಹಕರ ಮಾಹಿತಿಯನ್ನು ನಿರ್ವಹಿಸಲು ಮತ್ತು ಬಿಲ್ಲಿಂಗ್ ದಾಖಲೆಗಳು ಮತ್ತು ವರದಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಬಳಕೆದಾರರಿಗೆ ಸಹಾಯ ಮಾಡುವ ಬಿಲ್ಲಿಂಗ್ ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್ ನಿರ್ವಹಣೆ ಸಾಫ್ಟ್‌ವೇರ್ ಆಗಿದೆ.',
      p3: 'GoBill ಮೂಲಕ ರಚಿಸಲಾದ ಬಿಲ್‌ಗಳು, ಇನ್‌ವಾಯ್ಸ್‌ಗಳು, ತೆರಿಗೆ, GST ಮತ್ತು ಇತರ ವ್ಯಾಪಾರ ಮಾಹಿತಿಯು ಬಳಕೆದಾರರು ನಮೂದಿಸಿದ ಮಾಹಿತಿಯನ್ನು ಆಧರಿಸಿದೆ. ಒದಗಿಸಿದ ಮತ್ತು ರಚಿಸಲಾದ ಎಲ್ಲಾ ಮಾಹಿತಿಯು ನಿಖರವಾಗಿದೆ ಮತ್ತು ಪೂರ್ಣಗೊಂಡಿದೆ ಎಂದು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಬಳಕೆದಾರರು ಜವಾಬ್ದಾರರಾಗಿರುತ್ತಾರೆ.',
      p4: 'GoBill ಮೂಲಕ ರಚಿಸಲಾದ ಯಾವುದೇ ಇನ್‌ವಾಯ್ಸ್ ಅನ್ನು ನೀಡುವ ಅಥವಾ ಬಳಸುವ ಮೊದಲು ಬಳಕೆದಾರರು ಬೆಲೆಗಳು, GST, ತೆರಿಗೆಗಳು, ಗ್ರಾಹಕರ ವಿವರಗಳು ಮತ್ತು ಇತರ ವ್ಯಾಪಾರ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಬೇಕು.',
      p5: 'GoBill ಕೇವಲ ಬಿಲ್ಲಿಂಗ್ ಮತ್ತು ಇನ್‌ವಾಯ್ಸ್ ನಿರ್ವಹಣೆ ವೇದಿಕೆಯಾಗಿದೆ ಮತ್ತು ವೃತ್ತಿಪರ ತೆರಿಗೆ, ಕಾನೂನು, ಲೆಕ್ಕಪತ್ರ ಅಥವಾ ಹಣಕಾಸು ಸಲಹೆಯನ್ನು ಒದಗಿಸುವುದಿಲ್ಲ.',
      p6: 'ಚಂದಾದಾರಿಕೆ ಯೋಜನೆಗಳು ಮತ್ತು ಬಳಕೆಯ ಮಿತಿಗಳು ಬಳಕೆದಾರರು ಆಯ್ಕೆ ಮಾಡಿದ ಅನ್ವಯವಾಗುವ ಯೋಜನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ. Basic ಮತ್ತು Pro ಯೋಜನೆಗಳು ತಮ್ಮದೇ ಆದ ಮಾಸಿಕ ಬಿಲ್-ಉತ್ಪಾದನೆ ಮಿತಿಗಳು ಮತ್ತು ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಹೊಂದಿವೆ.',
      p7: 'ಬಳಕೆದಾರರು ಸೇವೆಯನ್ನು ದುರುಪಯೋಗಪಡಿಸಿಕೊಳ್ಳಬಾರದು, ಚಂದಾದಾರಿಕೆ ಮಿತಿಗಳನ್ನು ಬೈಪಾಸ್ ಮಾಡಬಾರದು ಅಥವಾ ಅನುಮತಿಯಿಲ್ಲದೆ ಮತ್ತೊಬ್ಬ ಬಳಕೆದಾರರ ಖಾತೆಯನ್ನು ಪ್ರವೇಶಿಸಬಾರದು.',
      p8: 'GoBill ತನ್ನ ವೈಶಿಷ್ಟ್ಯಗಳು, ಬೆಲೆ, ಬಳಕೆಯ ಮಿತಿಗಳು ಅಥವಾ ಈ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಕಾಲಕಾಲಕ್ಕೆ ನವೀಕರಿಸಬಹುದು.',
      p9: 'GoBill ಅನ್ನು ಬಳಸುವುದನ್ನು ಮುಂದುವರಿಸುವ ಮೂಲಕ ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರವೇಶಿಸುವ ಮೂಲಕ, ನೀವು ಈ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಓದಿದ್ದೀರಿ, ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೀರಿ ಮತ್ತು ಒಪ್ಪಿಕೊಂಡಿದ್ದೀರಿ ಎಂದು ನೀವು ಖಚಿತಪಡಿಸುತ್ತೀರಿ.',
      agree: 'ನಾನು ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳನ್ನು ಒಪ್ಪುತ್ತೇನೆ',
      continue: 'ನಾನು ಒಪ್ಪುತ್ತೇನೆ ಮತ್ತು ಮುಂದುವರಿಸುತ್ತೇನೆ'
    }
  };

  const text = content[language];

  const handleAccept = async () => {
    if (!accepted) return;
    
    try {
      setLoading(true);
      const res = await api.post('/auth/accept-terms');
      if (res && res.success) {
        dispatch(updateUser({ terms_accepted_at: res.data.user.terms_accepted_at }));
        navigate('/');
      }
    } catch (error) {
      console.error("Failed to accept terms:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .terms-page-bg {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f8fafc;
          padding: 20px;
        }
        
        .terms-container {
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 700px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
        }

        .terms-header {
          padding: 24px 32px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f8fafc;
        }

        .terms-content {
          padding: 32px;
          overflow-y: auto;
          flex: 1;
          color: #334155;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .terms-footer {
          padding: 24px 32px;
          border-top: 1px solid #e2e8f0;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Mobile specific styling to make it look like a native app screen */
        @media (max-width: 767px) {
          .terms-page-bg {
            padding: 0;
            background-color: #ffffff;
            align-items: flex-start;
          }
          
          .terms-container {
            max-width: 100%;
            border-radius: 0;
            box-shadow: none;
            max-height: 100vh;
            height: 100vh;
          }

          .terms-header {
            padding: 16px 20px;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .terms-content {
            padding: 20px;
            font-size: 0.9rem;
          }

          .terms-footer {
            padding: 16px 20px;
            padding-bottom: env(safe-area-inset-bottom, 20px);
          }
        }
      `}</style>
      <div className="terms-page-bg">
        <div className="terms-container">
        {/* Header */}
        <div className="terms-header">
          <h1 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>
            {text.title}
          </h1>
          
          {/* Language Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={18} color="#64748b" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                padding: '6px 32px 6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none'
              }}
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ml">മലയാളം (Malayalam)</option>
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
            </select>
            <div style={{ position: 'absolute', right: '10px', pointerEvents: 'none', color: '#64748b', fontSize: '0.8rem' }}>▼</div>
          </div>
        </div>

        {/* Content */}
        <div className="terms-content">
          <p style={{ marginBottom: '16px', fontWeight: '500' }}>{text.p1}</p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
            <li>{text.p2}</li>
            <li><strong>{text.p3}</strong></li>
            <li>{text.p4}</li>
            <li>{text.p5}</li>
            <li><strong>{text.p6}</strong></li>
            <li>{text.p7}</li>
            <li>{text.p8}</li>
          </ul>
          <p style={{ marginTop: '24px', fontWeight: '600', color: '#0f172a' }}>{text.p9}</p>
        </div>

        {/* Footer */}
        <div className="terms-footer">
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: `2px solid ${accepted ? '#2563eb' : '#cbd5e1'}`,
              backgroundColor: accepted ? '#2563eb' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}>
              {accepted && <Check size={16} color="#ffffff" strokeWidth={3} />}
            </div>
            <input 
              type="checkbox" 
              checked={accepted} 
              onChange={() => setAccepted(!accepted)}
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: '1.05rem', fontWeight: '500', color: '#0f172a' }}>{text.agree}</span>
          </label>

          <Button 
            onClick={handleAccept} 
            disabled={!accepted || loading}
            loading={loading}
            fullWidth
            size="lg"
            style={{ 
              opacity: accepted ? 1 : 0.6,
              transition: 'opacity 0.2s',
              fontSize: '1.05rem'
            }}
          >
            {text.continue}
          </Button>
        </div>
      </div>
      </div>
    </>
  );
};

export default TermsConditions;
