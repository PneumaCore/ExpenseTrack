import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { IonAvatar, IonButton, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonImg, IonInput, IonItem, IonLabel, IonList, IonLoading, IonPage, IonRow, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import ImageCompression from 'browser-image-compression';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { database } from '../configurations/firebase';
import './AccountSetup.css';

interface Currency {
  code: string;
  name: string;
}

const AccountSetup: React.FC = () => {
  const [page, setPage] = useState(1);
  const [profilePhoto, setProfilePhoto] = useState<string>('/assets/user.png');
  const [name, setName] = useState<string>('');
  const [surname1, setSurname1] = useState<string>('');
  const [surname2, setSurname2] = useState<string>('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [balance, setBalance] = useState(0);
  const history = useHistory();

  /* Buscamos el código y nombre de las divisas en la API de openexchangerates.org */
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {

        /* Obtenemos los nombres y códigos de las divisas desde la API */
        const response = await fetch('https://openexchangerates.org/api/currencies.json');
        const data = await response.json();

        const currencyList: Currency[] = Object.keys(data).map((key) => ({
          code: key,
          name: data[key],
        }));

        setCurrencies(currencyList);
        setFilteredCurrencies(currencyList);
      } catch (error) {
        console.error('Error al obtener las divisas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrencies();
  }, []);

  /* Seleccionamos una foto de perfil haciendo una foto con la cámara o escogiéndola de la galería */
  const handlePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        quality: 90,
      });

      if (photo?.webPath) {
        const imageBlob = await fetch(photo.webPath).then(res => res.blob());
        const fileName = "profile-photo.jpg";
        const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };

        const compressedImage = await ImageCompression(imageFile, options);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Image = reader.result as string;
          setProfilePhoto(base64Image);
        };
        reader.readAsDataURL(compressedImage);
      }
    } catch (error) {
      console.error('Error al obtener o comprimir la foto:', error);
    }
  };

  /* Si el usuario no desea añadir una imagen personalizada, se pondrá una por defecto */
  const resetToDefaultPhoto = () => {
    setProfilePhoto('/assets/user.png');
  };

  /* Barra de búsqueda para las divisas */
  const handleSearch = (e: any) => {
    const value = e.detail.value!;
    setSearchText(value);

    if (value) {
      const filtered = currencies.filter(
        (currency) =>
          currency.code.toLowerCase().includes(value.toLowerCase()) ||
          currency.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    } else {
      setFilteredCurrencies(currencies);
    }
  };

  const handleSaveAccountSetup = async () => {
    try {

      /* Obtenemos los datos del usuario autenticado */
      const auth = getAuth();
      const currentUser = auth.currentUser;

      /* Verificamos si el usuario está autenticado */
      if (!currentUser || !currentUser.uid) {
        throw new Error("El usuario no está autenticado.");
      }

      /* Generamos un ID automático con Firestore */
      const accountsRef = doc(collection(database, 'accounts'));
      const accountId = accountsRef.id;

      const newAccount = {
        account_id: accountId,
        user_id: currentUser?.uid,
        name: 'Principal',
        currency: selectedCurrency,
        balance: parseFloat(balance.toFixed(2)),
        icon: 'wallet',
        color: '#ff6347'
      }

      /* Guardamos la cuenta en la base de datos */
      await setDoc(accountsRef, newAccount);

      /* Marcamos como completo el formulario que debe realizar el usuario para configurar la cuenta principal para las transacciones y su divisa preferida */
      const usersRef = doc(database, "users", currentUser?.uid);

      await updateDoc(usersRef, {
        profile_photo: profilePhoto,
        name: name,
        surname_1: surname1,
        surname_2: surname2,
        currency: selectedCurrency,
        isAccountSetup: true,
      });

      history.push('/tab1');

    } catch (error) {

    }
  }

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Account Setup</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Pantalla con descripción y presentación breve sobre la aplicación */}
      {page === 1 && (
        <>
          <IonContent>
            <IonGrid className='account-setup-grid'>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <div className='account-setup-image-container'>
                    <IonImg src='/assets/icon.png' className='account-setup-image'></IonImg>
                  </div>
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <h2>¡Bienvenido a ExpenseTrack!</h2>
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonLabel>ExpenseTrack es una aplicación para controlar tus gastos e ingresos de manera sencilla.</IonLabel>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <div className='account-setup-footer'>
                <IonButton onClick={() => setPage(2)}>Comenzar</IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        </>
      )}

      {page === 2 && (
        <>
          <IonContent>
            <IonGrid className='account-setup-grid'>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <div className='account-setup-profile-photo-container'>
                    <IonAvatar className='account-setup-avatar'>
                      <img src={profilePhoto} alt="Foto de perfil" />
                    </IonAvatar>
                    <IonButton expand="block" onClick={handlePhoto}>Cambiar foto</IonButton>
                    <IonButton expand="block" color="danger" onClick={resetToDefaultPhoto}>Eliminar foto</IonButton>
                  </div>
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonInput label='Primer apellido' labelPlacement='floating' placeholder='Primer apellido' value={surname1} onIonChange={(e) => setSurname1(e.detail.value!)} required />
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonInput label='Segundo apellido' labelPlacement='floating' placeholder='Segundo apellido' value={surname2} onIonChange={(e) => setSurname2(e.detail.value!)} required />
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <div className='account-setup-footer'>
                <IonButton onClick={() => setPage(3)}>Comenzar</IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        </>
      )}

      {/* Pantalla para seleccionar la divisa de la cuenta principal */}
      {page === 3 && (
        <>
          <IonContent>
            <IonGrid className='account-setup-grid'>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <h2>Elije tu divisa</h2>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonSearchbar
                    placeholder="Buscar..."
                    value={searchText}
                    onIonInput={handleSearch}
                    debounce={0}
                    showClearButton="focus"
                    className='account-setup-currencies-search'
                  />
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonList className='account-setup-currencies-list'>
                    {loading ? (
                      <IonLoading isOpen={loading} message="Cargando divisas..." />
                    ) : (
                      filteredCurrencies.map((currency) => (
                        <IonItem key={currency.code} onClick={() => setSelectedCurrency(currency.code)} className={selectedCurrency === currency.code ? 'selected' : ''}>
                          <IonLabel>{currency.name}</IonLabel>
                          <IonLabel slot='end'>{currency.code}</IonLabel>
                        </IonItem>
                      ))
                    )}
                  </IonList>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <div className='account-setup-footer'>
                <IonButton onClick={() => setPage(4)}>Siguiente</IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        </>
      )}

      {/* Pantalla para seleccionar el balance de la cuenta principal */}
      {page === 4 && (
        <>
          <IonContent>
            <IonGrid>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <h2>Introduce el balance de tu cuenta principal</h2>
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2">
                  <IonLabel>Más tarde podrás añadir más cuentas en la sección Cuentas.</IonLabel>
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol size="12" size-md="8" offset-md="2" className='account-setup-currency'>
                  <IonItem>
                    <IonInput placeholder='0' type="number" value={balance} onIonChange={(e) => setBalance(parseFloat(e.detail.value!) || 0)} required />
                    <IonLabel slot='end' className='account-setup-balance-label'>{selectedCurrency}</IonLabel>
                  </IonItem>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <div className='account-setup-footer'>
                <IonButton onClick={handleSaveAccountSetup}>Finalizar</IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        </>
      )}
    </IonPage>
  );
};

export default AccountSetup;