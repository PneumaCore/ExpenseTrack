import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faQuestion, faReceipt, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonProgressBar, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './Budgets.css';

interface Category {
    category_id: string,
    user_id: string,
    name: string,
    mensualBudget: number | null,
    type: string,
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

const Budgets: React.FC = () => {
    const [preferredCurrency, setPreferredCurrency] = useState<string>("EUR");
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

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

    useEffect(() => {
        const fetchCategories = () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

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

    useEffect(() => {
        const fetchTransactions = () => {
            try {
                const auth = getAuth();
                const currentUser = auth.currentUser;

                const transactionsRef = collection(database, 'transactions');
                const q = query(transactionsRef, where('user_id', '==', currentUser?.uid), where('currency', '==', preferredCurrency));

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
    }, [preferredCurrency]);

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

    const getMonthlySpending = (categoryId: string) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return transactions
            .filter(transaction => transaction.category_id === categoryId && transaction.date.toDate() >= startOfMonth)
            .reduce((total, transaction) => total + transaction.amount, 0);
    };

    const filteredCategories = categories.filter(category => category.mensualBudget && category.mensualBudget > 0);

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Presupuestos</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonList className="budget-list">
                                {filteredCategories.length === 0 ? (
                                    <IonItem className="budget-message">
                                        <IonLabel>No hay presupuestos</IonLabel>
                                    </IonItem>
                                ) : (
                                    filteredCategories.map(category => {
                                        const monthlySpending = getMonthlySpending(category.category_id);
                                        const progress = monthlySpending / (category.mensualBudget || 1);
                                        const progressColor = progress >= 0.75 ? 'danger' : 'success';

                                        return (
                                            <>
                                                <div>
                                                    <IonLabel><b>{category.name}:</b> {monthlySpending.toFixed(2)} / {category.mensualBudget?.toFixed(2)} {preferredCurrency}</IonLabel>
                                                </div>
                                                <IonItem key={category.category_id} className="budget-item">
                                                    <div className="budget-icon-circle" slot='start' style={{ backgroundColor: category?.color }}>
                                                        <FontAwesomeIcon icon={getFontAwesomeIcon(category.icon)} className="budget-icon-font"></FontAwesomeIcon>
                                                    </div>
                                                    <IonProgressBar value={progress} color={progressColor}></IonProgressBar>
                                                </IonItem>
                                            </>
                                        );
                                    })
                                )}
                            </IonList>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default Budgets;