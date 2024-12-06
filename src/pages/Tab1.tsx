import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faReceipt, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonButtons, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { add } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import AddTransaction from '../components/AddTransaction';
import { database } from '../configurations/firebase';
import './Tab1.css';
ChartJS.register(ArcElement, Tooltip, Legend)

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
  created_at: Timestamp
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

const Tab1: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('gasto');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  {/* Filtramos las transacciones según el tipo de la transacción */ }
  const filteredTransactions = transactions.filter(transaction => transaction.type === type);

  {/* Filtramos las transacciones según el dia, la semana y el mes */}
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
    }
    return false;
  });

  {/* Representamos el gasto o ingreso total de las categorías en el gráfico */}
  const categoryTotals = filteredByRange.reduce((totals: any, transaction) => {
    totals[transaction.category_id] = (totals[transaction.category_id] || 0) + transaction.amount;
    return totals;
  }, {});

  {/* Datos para el gráfico */}
  const hasData = Object.keys(categoryTotals).length > 0;

  {/* Si hay datos, se muestran, si no, se muestra el gráfico en gris indicando que no hay transacciones */}
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

  useEffect(() => {
    const fetchTransactions = () => {
      try {

        /* Obtenemos los datos del usuario autenticado */
        const auth = getAuth();
        const currentUser = auth.currentUser;

        /* Obtenemos las categorías asociadas al usuario autenticado */
        const transactionsRef = collection(database, 'transactions');
        const q = query(transactionsRef, where('user_id', '==', currentUser?.uid));

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
        const q = query(categoriesRef, where('user_id', '==', currentUser?.uid));

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
      'receipt': faReceipt
    };
    return icons[iconName] || faHome;
  }

  return (
    <IonPage id="main-content">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton></IonMenuButton>
          </IonButtons>
          <IonTitle>Transacciones</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>

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
              </IonSegment>
            </IonCol>
          </IonRow>

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
                    return (
                      <IonItem key={transaction.transaction_id} className="transaction-item">
                        <div className="transaction-category-circle" slot='start' style={{ backgroundColor: category?.color }}>
                          <FontAwesomeIcon icon={getFontAwesomeIcon(category?.icon || 'default')} className="transaction-category-icon" />
                        </div>
                        <IonLabel className="transaction-label"> {category?.name} </IonLabel>
                        <IonLabel className="transaction-amount" slot='end'> {transaction.amount} $</IonLabel>
                      </IonItem>
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
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
