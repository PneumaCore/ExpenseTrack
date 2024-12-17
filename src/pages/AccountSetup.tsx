import { IonButton, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonImg, IonInput, IonItem, IonLabel, IonList, IonLoading, IonPage, IonRow, IonSearchbar, IonTitle, IonToolbar } from '@ionic/react';
import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { database } from '../configurations/firebase';
import './AccountSetup.css';
import { getAuth } from 'firebase/auth';

interface Currency {
  code: string;
  name: string;
}

const AccountSetup: React.FC = () => {
  const [page, setPage] = useState(1);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [balance, setBalance] = useState(0);
  const history = useHistory();

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {

        /* Obtenemos las divisas */
        const currenciesRef = await getDocs(collection(database, 'currencies'));
        const currencyList: Currency[] = currenciesRef.docs.map((doc) => doc.data() as Currency);

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
        balance: balance,
        icon: 'wallet',
        color: '#ff6347'
      }

      /* Guardamos la cuenta en la base de datos */
      await setDoc(accountsRef, newAccount);

      /* Marcamos como completo el formulario que debe realizar el usuario para configurar la cuenta principal para las transacciones */
      const usersRef = doc(database, "users", currentUser?.uid);

      await updateDoc(usersRef, {
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
                <IonCol>
                  <IonImg src='/assets/icon.png' className='account-setup-image'></IonImg>
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol>
                  <h2>¡Bienvenido a ExpenseTrack!</h2>
                </IonCol>
              </IonRow>
              <IonRow className='account-setup-row'>
                <IonCol>
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

      {/* Pantalla para seleccionar la divisa de la cuenta principal */}
      {page === 2 && (
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
                <IonButton onClick={() => setPage(3)}>Siguiente</IonButton>
              </div>
            </IonToolbar>
          </IonFooter>
        </>
      )}

      {/* Pantalla para seleccionar el balance de la cuenta principal */}
      {page === 3 && (
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
                  <IonInput className='account-setup-balance-input' placeholder='0' type="number" value={balance} onIonChange={(e) => setBalance(parseFloat(e.detail.value!) || 0)} required />
                  <IonLabel>{selectedCurrency}</IonLabel>
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