import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonProgressBar, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonGrid, IonRow, IonCol } from "@ionic/react";
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

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
                            <IonList>
                                {filteredCategories.length === 0 ? (
                                    <IonItem className="budget-message">
                                        <IonLabel>No hay presupuestos</IonLabel>
                                    </IonItem>
                                ) : (
                                    filteredCategories.map(category => {
                                        const monthlySpending = getMonthlySpending(category.category_id);
                                        const progress = monthlySpending / (category.mensualBudget || 1);
                                        return (
                                            <IonItem key={category.category_id}>
                                                <IonLabel>
                                                    {category.name}: {monthlySpending.toFixed(2)} / {category.mensualBudget?.toFixed(2)}
                                                </IonLabel>
                                                <IonProgressBar value={progress}></IonProgressBar>
                                            </IonItem>
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