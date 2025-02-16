import { IonButtons, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, Timestamp, where } from "firebase/firestore";
import { add } from "ionicons/icons";
import { useEffect, useState } from "react";
import AddRecurringTransaction from "../components/AddRecurringTransaction";
import EditRecurringTransaction from "../components/EditRecurringTransaction";
import { database } from "../configurations/firebase";
import "./RecurringTransactions.css";

interface RecurringTransaction {
    recurring_transaction_id: string,
    user_id: string,
    type: string,
    name: string,
    category_id: string,
    account_id: string,
    amount: number,
    currency: number,
    date: Timestamp,
    frequency: string,
    next_execution: Timestamp
}

const RecurringTransactions: React.FC = () => {
    const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRecurringTransaction, setSelectedRecurringTransaction] = useState<RecurringTransaction | null>(null);

    /* Leemos las transacciones recurrentes del usuario de la base de datos */
    useEffect(() => {
        const fetchAccounts = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las transacciones recurrentes asociadas al usuario autenticado */
                const recurringTransactionsRef = collection(database, 'recurringTransactions');
                const q = query(recurringTransactionsRef, where('user_id', '==', currentUser?.uid));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedAccounts = querySnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        recurring_transaction_id: doc.id,
                    })) as RecurringTransaction[];
                    setRecurringTransactions(fetchedAccounts);
                });
                return unsubscribe;

            } catch (error) {
                console.error("Error al obtener las transacciones recurrentes: ", error);
            }
        };
        const unsubscribe = fetchAccounts();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const handleEditRecurringTransaction = (recurringTransaction: RecurringTransaction) => {
        setSelectedRecurringTransaction(recurringTransaction);
        setIsEditModalOpen(true);
    };

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Pagos recurrentes</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>

                    {/* Listado de transacciones recurrentes */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonList className="recurring-transaction-list">
                                {recurringTransactions.length === 0 ? (
                                    <IonItem className="recurring-transaction-message">
                                        <IonLabel>No hay pagos recurrentes</IonLabel>
                                    </IonItem>
                                ) : (
                                    recurringTransactions.map((recurringTransaction) => {
                                        return (
                                            <IonItem key={recurringTransaction.account_id} className="recurring-transaction-item" onClick={() => handleEditRecurringTransaction(recurringTransaction)}>
                                                <IonLabel>{recurringTransaction.name}</IonLabel>
                                            </IonItem>
                                        );
                                    })
                                )}
                            </IonList>
                        </IonCol>
                    </IonRow>
                </IonGrid>

                <IonFab slot="fixed" vertical="bottom" horizontal="center">

                    {/* Abrir el modal para añadir categorías */}
                    <IonFabButton color="medium" className="add-recurring-transaction-fab-button" onClick={() => setIsAddModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir pagos recurrentes */}
                <AddRecurringTransaction isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}></AddRecurringTransaction>

                {/* Modal para editar o eliminar pagos recurrentes */}
                <EditRecurringTransaction isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} recurringTransaction={selectedRecurringTransaction}></EditRecurringTransaction>
            </IonContent>
        </IonPage>
    );
}

export default RecurringTransactions;