import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faQuestion, faReceipt, faSearch, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonFab, IonFabButton, IonFooter, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonModal, IonPage, IonRow, IonSearchbar, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/react';
import axios from 'axios';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, onSnapshot, or, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { add, chevronBack, search } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import AddTransaction from '../components/AddTransaction';
import EditTransaction from '../components/EditTransaction';
import { database } from '../configurations/firebase';
import './Home.css';
ChartJS.register(ArcElement, Tooltip, Legend)

interface Account {
  account_id: string,
  user_id: string,
  name: string,
  currency: string,
  balance: number,
  icon: string,
  color: string
}

interface Transaction {
  transaction_id: string,
  user_id: string,
  type: string,
  category_id: string,
  account_id: string,
  amount: number,
  currency: string,
  date: Timestamp,
  note: string,
  image: string[]
}

interface Category {
  category_id: string,
  user_id: string,
  name: string,
  type: string,
  icon: string,
  color: string
}

ChartJS.register(ArcElement, Tooltip, Legend);

const Home: React.FC = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDateOpen, setIsDateModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const selectedAccount = accounts.find(account => account.account_id === selectedAccountId);
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [type, setType] = useState('gasto');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState<string>("EUR");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
  const [totalBalanceInPreferredCurrency, setTotalBalanceInPreferredCurrency] = useState<number>(0);
  const [selectedAccountBalanceInPreferredCurrency, setSelectedAccountBalanceInPreferredCurrency] = useState<number | null>(null);

  /* Leemos las divisa preferida del usuario de la base de datos */
  useEffect(() => {
    const fetchUserCurrency = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        const usersRef = collection(database, 'users');
        const q = query(usersRef, where('uid', '==', currentUser?.uid));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          setPreferredCurrency(userData.currency || "EUR");
        }
      } catch (error) {
        console.error("Error al obtener la divisa preferida del usuario: ", error);
      }
    };

    fetchUserCurrency();
  }, []);

  /* Utilizamos una API para consultar el valor de las divisas */
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${preferredCurrency}`);
        setExchangeRates(response.data.rates);
      } catch (error) {
        console.error("Error al obtener las tasas de cambio: ", error);
      }
    };

    if (preferredCurrency) {
      fetchExchangeRates();
    }
  }, [preferredCurrency]);

  /* Calculamos el total de saldo de las cuentas según la divisa preferida */
  useEffect(() => {
    if (accounts.length > 0 && Object.keys(exchangeRates).length > 0) {
      const total = accounts.reduce((sum, account) => {
        const rate = account.currency === preferredCurrency ? 1 : exchangeRates[account.currency];
        return rate ? sum + account.balance / rate : sum;
      }, 0);

      setTotalBalanceInPreferredCurrency(total);
    }
  }, [accounts, exchangeRates, preferredCurrency]);

  /* Leemos las cuentas del usuario de la base de datos */
  useEffect(() => {
    const fetchAccounts = () => {
      try {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Obtenemos las cuentas asociadas al usuario autenticado */
        const transactionsRef = collection(database, 'accounts');
        const q = query(transactionsRef, where('user_id', '==', currentUser?.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedAccounts = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            account_id: doc.id,
          })) as Account[];
          setAccounts(fetchedAccounts);
        });
        return unsubscribe;

      } catch (error) {
        console.error("Error al obtener las transacciones: ", error);
      }
    };
    const unsubscribe = fetchAccounts();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  {/* Filtramos las transacciones según el tipo de la transacción, cuenta, categoría, etc. */ }
  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = transaction.type === type;
    const matchesAccount = !selectedAccountId || transaction.account_id === selectedAccountId;
    const category = categories.find(cat => cat.category_id === transaction.category_id);
    const matchesCategory = category?.name.toLowerCase().includes(searchText.toLowerCase()) ?? false;
    const matchesSearch = transaction.note.toLowerCase().includes(searchText.toLowerCase()) || matchesCategory;
    return matchesType && matchesAccount && matchesSearch;
  });

  {/* Filtramos las transacciones según el dia, la semana y el mes */ }
  const now = new Date();
  const filteredByRange = filteredTransactions.filter((transaction) => {
    const transactionDate = transaction.date.toDate();

    if (timeRange === 'today') {
      return transactionDate.toDateString() === now.toDateString();
    } else if (timeRange === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return transactionDate >= startOfWeek;
    } else if (timeRange === 'month') {
      return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear();
    } else if (timeRange === 'year') {
      return transactionDate.getFullYear() === now.getFullYear();
    } else if (timeRange === 'custom') {
      if (!startDate || !endDate) {
        return false;
      }
      const start = new Date(startDate);
      const end = new Date(endDate);
      return transactionDate >= start && transactionDate <= end;
    }
    return false;
  });

  {/* Representamos el gasto o ingreso total de las categorías en el gráfico */ }
  const categoryTotals = filteredByRange.reduce((totals: any, transaction) => {
    totals[transaction.category_id] = (totals[transaction.category_id] || 0) + transaction.amount;
    return totals;
  }, {});

  {/* Datos para el gráfico */ }
  const hasData = filteredByRange.length > 0;

  {/* Si hay datos, se muestran, si no, se muestra el gráfico en gris indicando que no hay transacciones */ }
  const pieData = hasData
    ? {
      labels: categories
        .filter(cat => categoryTotals[cat.category_id])
        .map(cat => cat.name),
      datasets: [
        {
          data: categories
            .filter(cat => categoryTotals[cat.category_id])
            .map(cat => categoryTotals[cat.category_id]),
          backgroundColor: categories
            .filter(cat => categoryTotals[cat.category_id])
            .map(cat => cat.color || '#CCCCCC'),
          borderWidth: 1,
        },
      ],
    }
    : {
      labels: ['Sin datos'],
      datasets: [
        {
          data: [1],
          backgroundColor: ['#E0E0E0'],
          borderWidth: 1,
        },
      ],
    };

  /* Leemos las transacciones realizadas por el usuario de la base de datos */
  useEffect(() => {
    const fetchTransactions = () => {
      try {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Obtenemos las categorías asociadas al usuario autenticado */
        const transactionsRef = collection(database, 'transactions');
        const q = query(transactionsRef, where('user_id', '==', currentUser?.uid), orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedTransactions = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            transaction_id: doc.id,
          })) as Transaction[];
          setTransactions(fetchedTransactions);
        });
        return unsubscribe;

      } catch (error) {
        console.error("Error al obtener las transacciones: ", error);
      }
    };
    const unsubscribe = fetchTransactions();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchCategories = () => {
      try {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Obtenemos las categorías asociadas al usuario autenticado */
        const categoriesRef = collection(database, 'categories');
        const q = query(
          categoriesRef,
          or(
            where('user_id', '==', currentUser?.uid),
            where('user_id', '==', '')
          )
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const fetchedCategories = querySnapshot.docs.map((doc) => ({
            ...doc.data(),
            category_id: doc.id,
          })) as Category[];
          setCategories(fetchedCategories);
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error al obtener las categorías: ", error);
      }
    };
    const unsubscribe = fetchCategories();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  /* Mapeamos todos los iconos de las categorías, si alguno no existe, se mapea uno por defecto */
  const getFontAwesomeIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      'home': faHome,
      'light-bulb': faLightbulb,
      'tools': faTools,
      'gas-pump': faGasPump,
      'bus': faBus,
      'wrench': faWrench,
      'car': faCar,
      'cart-shopping': faShoppingCart,
      'utensils': faUtensils,
      'briefcase-medical': faBriefcaseMedical,
      'pills': faPills,
      'user-md': faUserMd,
      'film': faFilm,
      'music': faMusic,
      'puzzle-piece': faPuzzlePiece,
      'graduation-cap': faGraduationCap,
      'book': faBook,
      'chalkboard-teacher': faChalkboardTeacher,
      'credit-card': faCreditCard,
      'money-bill-wave': faMoneyBillWave,
      'piggy-bank': faPiggyBank,
      'chart-line': faChartLine,
      'gift': faGift,
      'hand-holding-heart': faHandHoldingHeart,
      'shopping-bag': faShoppingBag,
      'briefcase': faBriefcase,
      'hand-holding-usd': faHandHoldingUsd,
      'laptop': faLaptop,
      'shopping-basket': faShoppingBasket,
      'coins': faCoins,
      'chart-bar': faChartBar,
      'building': faBuilding,
      'sync-alt': faSyncAlt,
      'trophy': faTrophy,
      'receipt': faReceipt,
      'question': faQuestion
    };
    return icons[iconName] || faHome;
  }

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          {!isSearchActive ? (
            <>
              <IonButtons slot="start">
                <IonMenuButton></IonMenuButton>
              </IonButtons>
              <IonTitle>Transferencias</IonTitle>
              <IonButtons slot='end'>
                <IonButton onClick={() => setIsSearchActive(true)} size='default'>
                  <IonIcon icon={search} />
                </IonButton>
              </IonButtons>
            </>
          ) : (
            <>
              <IonSearchbar animated placeholder="Buscar..." showCancelButton="always" onIonCancel={() => { setIsSearchActive(false); setSearchText(''); }} onIonInput={(e) => setSearchText(e.detail.value!)} />
            </>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Transacciones</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Seleccionamos la cuenta de las transacciones */}
        <IonSelect labelPlacement="floating" onIonChange={(e) => setSelectedAccountId(e.detail.value)} value={selectedAccountId}>
          <IonSelectOption value={null}>Total</IonSelectOption>
          {accounts.map(account => (
            <IonSelectOption key={account.account_id} value={account.account_id}>
              {account.name}
            </IonSelectOption>
          ))}
        </IonSelect>

        {/* Mostramos el saldo total de la cuenta seleccionada por el usuario */}
        <IonLabel>
          {selectedAccountId
            ? `${selectedAccount?.balance} ${selectedAccount?.currency}`
            : `${totalBalanceInPreferredCurrency.toFixed(2)} ${preferredCurrency}`
          }
        </IonLabel>

        {/* Seleccionamos el tipo de transacción */}
        <IonSegment value={type} onIonChange={(e: CustomEvent) => setType(e.detail.value)}>
          <IonSegmentButton value="gasto">
            <IonLabel>Gasto</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="ingreso">
            <IonLabel>Ingreso</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonGrid>

          {/* Filtramos el tipo de transacción según el período */}
          <IonRow>
            <IonCol size="12">
              <IonSegment value={timeRange} onIonChange={(e: CustomEvent) => setTimeRange(e.detail.value)}>
                <IonSegmentButton value="today">
                  <IonLabel>Hoy</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="week">
                  <IonLabel>Semana</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="month">
                  <IonLabel>Mes</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="year">
                  <IonLabel>Año</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="custom" onClick={() => setIsDateModalOpen(true)}>
                  <IonLabel>Período</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonCol>
          </IonRow>

          {/* Selector de rango de fechas para "Período" */}
          {timeRange === 'custom' && (
            <div>
              <IonModal isOpen={isDateOpen} onDidDismiss={() => setIsDateModalOpen(false)}>
                <IonHeader>
                  <IonToolbar>
                    <IonTitle>Período</IonTitle>
                    <IonButton slot="start" onClick={() => (setIsDateModalOpen(false))} fill='clear'>
                      <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                  </IonToolbar>
                </IonHeader>
                <IonContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="12" size-md="8" offset-md="2">
                        <IonItem>
                          <IonDatetime presentation="date" value={startDate || new Date().toISOString()}
                            onIonChange={(e) => {
                              if (typeof e.detail.value === 'string') {
                                setStartDate(e.detail.value);
                              }
                            }}
                          />
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    <IonRow>
                      <IonCol size="12" size-md="8" offset-md="2">
                        <IonItem>
                          <IonDatetime presentation="date" value={endDate || new Date().toISOString()}
                            onIonChange={(e) => {
                              if (typeof e.detail.value === 'string') {
                                setEndDate(e.detail.value);
                              }
                            }}
                          />
                        </IonItem>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonContent>
                <IonFooter>
                  <IonToolbar>
                    <div className='date-period-picker-footer'>

                      {/* Botón para aplicar el filtro */}
                      <IonButton onClick={() => setIsDateModalOpen(false)}>Aplicar</IonButton>
                    </div>
                  </IonToolbar>
                </IonFooter>
              </IonModal>
            </div>
          )}

          {/* Gráfico de transacciones */}
          <IonRow>
            <IonCol size="12">
              <Pie data={pieData} />
            </IonCol>
          </IonRow>

          {/* Listado de transacciones */}
          <IonRow>
            <IonCol>
              <IonList>
                {filteredByRange.length === 0 ? (
                  <IonItem className="transaction-message">
                    <IonLabel>No hay transacciones</IonLabel>
                  </IonItem>
                ) : (
                  filteredByRange.map((transaction) => {
                    const category = categories.find(cat => cat.category_id === transaction.category_id);
                    const transferDate = transaction.date.toDate();
                    const formattedDate = transferDate.toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <>
                        <div className='transfer-date-container'>
                          <IonLabel>{formattedDate}</IonLabel>
                        </div>
                        <IonItem key={transaction.transaction_id} className="transaction-item" onClick={() => handleEditTransaction(transaction)}>
                          <div className="transaction-category-circle" slot='start' style={{ backgroundColor: category?.color }}>
                            <FontAwesomeIcon icon={getFontAwesomeIcon(category?.icon || 'default')} className="transaction-category-icon" />
                          </div>
                          <IonLabel className="transaction-label"> {category?.name} </IonLabel>
                          <IonLabel className="transaction-amount" slot='end'> {transaction.amount.toFixed(2)} {transaction.currency}</IonLabel>
                        </IonItem>
                      </>
                    );
                  })
                )}
              </IonList>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonFab slot="fixed" vertical="bottom" horizontal="center">

          {/* Abrir el modal para añadir transacciones */}
          <IonFabButton onClick={() => setIsModalOpen(true)}>
            <IonIcon icon={add}></IonIcon>
          </IonFabButton>
        </IonFab>

        {/* Modal para añadir transacciones */}
        <AddTransaction isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}></AddTransaction>

        {/* Modal para editar o eliminar transacciones */}
        <EditTransaction isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transaction={selectedTransaction}></EditTransaction>
      </IonContent>
    </IonPage>
  );
};

export default Home;
