import { IonButtons, IonCol, IonContent, IonGrid, IonHeader, IonLabel, IonMenuButton, IonPage, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { getAuth } from 'firebase/auth';
import { Timestamp, collection, onSnapshot, or, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useHistory } from 'react-router';
import { database } from '../configurations/firebase';
import './Charts.css';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Transaction {
    transaction_id: string;
    user_id: string;
    type: string;
    category_id: string;
    account_id: string;
    amount: number;
    currency: string;
    date: Timestamp;
    note: string;
}

interface Category {
    category_id: string;
    name: string;
    type: string;
    color: string;
}

const Charts: React.FC = () => {
    const history = useHistory();
    const [type, setType] = useState<'ingreso' | 'gasto'>('gasto');
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    /* Leemos las transacciones realizadas por el usuario de la base de datos */
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

    {/* Filtramos las transacciones según el dia, la semana y el mes */ }
    const now = new Date();
    const filterByTimeRange = (transaction: Transaction) => {
        const transactionDate = transaction.date.toDate();

        switch (timeRange) {
            case 'today':
                return transactionDate.toDateString() === now.toDateString();
            case 'week':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                return transactionDate >= startOfWeek;
            case 'month':
                return (
                    transactionDate.getMonth() === now.getMonth() &&
                    transactionDate.getFullYear() === now.getFullYear()
                );
            case 'year':
                return transactionDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    };

    const filteredTransactions = transactions
        .filter((transaction) => transaction.type === type)
        .filter(filterByTimeRange);

    {/* Representamos el gasto o ingreso total de las categorías en el gráfico */ }
    const categoryTotals = filteredTransactions.reduce((totals: Record<string, number>, transaction) => {
        totals[transaction.category_id] = (totals[transaction.category_id] || 0) + transaction.amount;
        return totals;
    }, {});

    const chartData = {
        labels: categories
            .filter((category) => categoryTotals[category.category_id])
            .map((category) => category.name),
        datasets: [
            {
                label: '',
                data: categories
                    .filter((category) => categoryTotals[category.category_id])
                    .map((category) => categoryTotals[category.category_id]),
                backgroundColor: categories
                    .filter((category) => categoryTotals[category.category_id])
                    .map((category) => category.color || '#CCCCCC'),
            },
        ],
    };

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Gráficos</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>

                {/* Seleccionamos el tipo de transacción */}
                <IonSegment value={type} onIonChange={(e) => setType(e.detail.value as 'ingreso' | 'gasto')}>
                    <IonSegmentButton value="gasto">
                        <IonLabel>Gasto</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="ingreso">
                        <IonLabel>Ingreso</IonLabel>
                    </IonSegmentButton>
                </IonSegment>

                {/* Filtramos el tipo de transacción según el período */}
                <IonSegment value={timeRange} onIonChange={(e) => setTimeRange(e.detail.value as typeof timeRange)}>
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
                </IonSegment>

                <IonGrid>

                    {/* Gráfico de transacciones */}
                    <IonRow>
                        <IonCol size="12">
                            <div className='chart-bar-chart'>
                                <Bar data={chartData} options={{
                                    responsive: true, plugins: {
                                        legend: {
                                            display: false,
                                        },
                                    }
                                }} />
                            </div>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default Charts;