import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faQuestion, faReceipt, faSackDollar, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonAlert, IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonModal, IonPage, IonRow, IonSearchbar, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import axios from 'axios';
import { ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, or, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { add, chevronBack, search } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import AddTransaction from '../components/AddTransaction';
import EditTransaction from '../components/EditTransaction';
import { database } from '../configurations/firebase';
import './Charts.css';
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

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
    mensualBudget: number,
    type: string,
    icon: string,
    color: string
}

ChartJS.register(ArcElement, Tooltip, Legend);

const Charts: React.FC = () => {
    const [isAccountAlertOpen, setIsAccountAlertOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDateOpen, setIsDateModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const selectedAccount = accounts.find(account => account.account_id === selectedAccountId);
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

    /* Leemos las divisa preferida del usuario de la base de datos */
    useEffect(() => {
        const fetchUserCurrency = () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

                if (!currentUser) {
                    throw new Error("El usuario no está autenticado.");
                }

                const usersRef = collection(database, 'users');
                const q = query(usersRef, where('uid', '==', currentUser.uid));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    if (!snapshot.empty) {
                        const userData = snapshot.docs[0].data();
                        setPreferredCurrency(userData.currency || "EUR");
                    }
                });

                return unsubscribe;
            } catch (error) {
                console.error("Error al obtener la divisa preferida del usuario: ", error);
            }
        };

        const unsubscribe = fetchUserCurrency();
        return () => {
            if (unsubscribe) unsubscribe();
        };
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
        const matchesNote = transaction.note.toLowerCase().includes(searchText.toLowerCase()) || matchesCategory;
        return matchesType && matchesAccount && matchesNote;
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
    const barData = hasData
        ? {
            labels: categories
                .filter(cat => categoryTotals[cat.category_id])
                .map(cat => cat.name),
            datasets: [
                {
                    label: '',
                    data: categories
                        .filter(cat => categoryTotals[cat.category_id])
                        .map(cat => categoryTotals[cat.category_id]),
                    backgroundColor: categories
                        .filter(cat => categoryTotals[cat.category_id])
                        .map(cat => cat.color || '#CCCCCC'),
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

    /* Leemos las categorías de la base de datos */
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
                        where('user_id', '==', null)
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
                            <IonTitle>Gráficos</IonTitle>
                            <IonButtons slot='end'>
                                <IonButton onClick={() => setIsAccountAlertOpen(true)}>
                                    <FontAwesomeIcon icon={faSackDollar} />
                                </IonButton>
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
                        <IonTitle size="large">Gráficos</IonTitle>
                    </IonToolbar>
                </IonHeader>

                <IonGrid>

                    {/* Seleccionamos la cuenta de las transacciones */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonAlert
                                isOpen={isAccountAlertOpen}
                                onDidDismiss={() => setIsAccountAlertOpen(false)}
                                header="Filtrar por cuenta"
                                inputs={[
                                    { label: 'Total', type: 'radio' as const, value: null, checked: selectedAccountId === null },
                                    ...accounts.map(account => ({
                                        label: account.name,
                                        type: 'radio' as const,
                                        value: account.account_id,
                                        checked: selectedAccountId === account.account_id
                                    }))
                                ]}
                                buttons={[
                                    {
                                        text: 'Cancelar',
                                        role: 'cancel',
                                        handler: () => setIsAccountAlertOpen(false)
                                    },
                                    {
                                        text: 'Aceptar',
                                        handler: (selected) => setSelectedAccountId(selected)
                                    }
                                ]}
                            />
                        </IonCol>
                    </IonRow>

                    {/* Mostramos el saldo total de la cuenta seleccionada por el usuario */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <div className='chart-total-balance'>
                                <IonLabel>
                                    <b>
                                        {selectedAccountId
                                            ? `${selectedAccount?.balance.toFixed(2)} ${selectedAccount?.currency}`
                                            : `${totalBalanceInPreferredCurrency.toFixed(2)} ${preferredCurrency}`
                                        }
                                    </b>
                                </IonLabel>
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                {/* Seleccionamos el tipo de transacción */}
                <IonRow>
                    <IonCol size="12" size-md="8" offset-md="2">
                        <IonSegment value={type} onIonChange={(e: CustomEvent) => setType(e.detail.value)}>
                            <IonSegmentButton value="gasto">
                                <IonLabel>Gasto</IonLabel>
                            </IonSegmentButton>
                            <IonSegmentButton value="ingreso">
                                <IonLabel>Ingreso</IonLabel>
                            </IonSegmentButton>
                        </IonSegment>
                    </IonCol>
                </IonRow>

                <IonGrid>

                    {/* Filtramos el tipo de transacción según el período */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
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
                                        <IonTitle>Filtrar por período</IonTitle>
                                        <IonButton slot="start" onClick={() => (setIsDateModalOpen(false))} fill='clear'>
                                            <IonIcon icon={chevronBack}></IonIcon>
                                        </IonButton>
                                    </IonToolbar>
                                </IonHeader>
                                <IonContent>
                                    <IonGrid>
                                        <IonRow>
                                            <IonCol size="12" size-md="8" offset-md="2">
                                                <IonItem lines='none'>
                                                    <IonDatetime presentation="date" value={startDate || new Date().toISOString()} max={new Date().toISOString().split('T')[0]}
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
                                                <IonItem lines='none'>
                                                    <IonDatetime presentation="date" value={endDate || new Date().toISOString()} max={new Date().toISOString().split('T')[0]}
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
                                    <IonFab slot="fixed" vertical="bottom" horizontal="center">
                                        <div>

                                            {/* Botón para aplicar el filtro */}
                                            <IonButton className='chart-calendar-fab-button' color={"medium"} shape="round" onClick={() => setIsDateModalOpen(false)}>Aplicar</IonButton>
                                        </div>
                                    </IonFab>
                                </IonContent>
                            </IonModal>
                        </div>
                    )}

                    {/* Gráfico de transacciones */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <div className='chart-bar-chart'>
                                <Bar data={barData} options={{
                                    responsive: true, plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    }
                                }} />
                            </div>
                        </IonCol>
                    </IonRow>

                    {/* Listado de transacciones */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonList className='chart-list'>
                                {filteredByRange.length === 0 ? (
                                    <IonItem className="chart-message">
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
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: false,
                                        });

                                        return (
                                            <>
                                                <div className='transfer-date-container'>
                                                    <IonLabel>{formattedDate}</IonLabel>
                                                </div>
                                                <IonItem key={transaction.transaction_id} className="chart-item" onClick={() => handleEditTransaction(transaction)}>
                                                    <div className="chart-category-circle" slot='start' style={{ backgroundColor: category?.color }}>
                                                        <FontAwesomeIcon icon={getFontAwesomeIcon(category?.icon || 'default')} className="chart-category-icon" />
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
                    <IonFabButton color="medium" className='chart-fab-button' onClick={() => setIsModalOpen(true)}>
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

export default Charts;