import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonButton, IonButtons, IonCol, IonContent, IonDatetime, IonFab, IonFabButton, IonFooter, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonModal, IonPage, IonRow, IonSearchbar, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import { add, chevronBack, search } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import AddTransfer from '../components/AddTransfer';
import EditTransfer from '../components/EditTransfer';
import { database } from '../configurations/firebase';
import './Transfers.css';

interface Account {
    account_id: string,
    user_id: string,
    name: string,
    currency: string,
    balance: number,
    icon: string,
    color: string
}

interface Transfer {
    transfer_id: string,
    user_id: string,
    source_account_id: string,
    destination_account_id: string,
    amount: number,
    converted_amount: number,
    source_currency: string,
    destination_currency: string,
    date: Timestamp,
    note: string
};

const Transfers: React.FC = () => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('today');
    const [startDate, setStartDate] = useState<string | null>(null);
    const [endDate, setEndDate] = useState<string | null>(null);
    const [isDateOpen, setIsDateModalOpen] = useState(false);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);

    /* Leemos las transferencias del usuario de la base de datos */
    useEffect(() => {
        const fetchTransfers = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las transferencias asociadas al usuario autenticado */
                const transfersRef = collection(database, 'transfers');
                const q = query(transfersRef, where('user_id', '==', currentUser?.uid), orderBy('date', 'desc'));

                const unsubscribe = onSnapshot(q, (querySnapshot) => {
                    const fetchedTransfers = querySnapshot.docs.map((doc) => ({
                        ...doc.data(),
                        transfer_id: doc.id,
                    })) as Transfer[];
                    setTransfers(fetchedTransfers);
                });
                return unsubscribe;

            } catch (error) {
                console.error("Error al obtener las transferencias: ", error);
            }
        };
        const unsubscribe = fetchTransfers();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

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

    {/* Filtramos las transferencias según el dia, semana, mes, año o período */ }
    const now = new Date();
    const filteredByRange = transfers.filter((transfer) => {
        const transferDate = transfer.date.toDate();

        if (timeRange === 'today') {
            return transferDate.toDateString() === now.toDateString();
        } else if (timeRange === 'week') {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            return transferDate >= startOfWeek;
        } else if (timeRange === 'month') {
            return transferDate.getMonth() === now.getMonth() && transferDate.getFullYear() === now.getFullYear();
        } else if (timeRange === 'year') {
            return transferDate.getFullYear() === now.getFullYear();
        } else if (timeRange === 'custom') {
            if (!startDate || !endDate) {
                return false;
            }
            const start = new Date(startDate);
            const end = new Date(endDate);
            return transferDate >= start && transferDate <= end;
        }
        return false;
    });

    {/* Filtramos las transferencias según el tipo de la cuenta de origen, cuenta de destino, etc. */ }
    const filteredTransfers = filteredByRange.filter((transfer) => {
        const sourceAccount = accounts.find(account => account.account_id === transfer.source_account_id);
        const destinationAccount = accounts.find(account => account.account_id === transfer.destination_account_id);
        const matchesSearchText = searchText.toLowerCase();
        const matchesSourceAccountName = sourceAccount?.name.toLowerCase() || "";
        const matchesDestinationAccountName = destinationAccount?.name.toLowerCase() || "";
        const matchesNote = transfer.note.toLowerCase();

        return (
            (matchesSourceAccountName.includes(matchesSearchText) ||
                matchesDestinationAccountName.includes(matchesSearchText) ||
                matchesNote.includes(matchesSearchText)) &&
            filteredByRange.includes(transfer)
        );
    });

    const handleEditTransfer = (transfer: Transfer) => {
        setSelectedTransfer(transfer);
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
                <IonGrid>

                    {/* Filtramos el tipo de transferencia según el período */}
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
                                                <IonItem>
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
                                            <IonButton className='transfer-calendar-fab-button' color={"medium"} shape="round" onClick={() => setIsDateModalOpen(false)}>Aplicar</IonButton>
                                        </div>
                                    </IonFab>
                                </IonContent>
                            </IonModal>
                        </div>
                    )}

                    {/* Listado de transferencias */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonList className='transfer-list'>
                                {filteredTransfers.length === 0 ? (
                                    <IonItem className="transfer-message">
                                        <IonLabel>No hay transferencias</IonLabel>
                                    </IonItem>
                                ) : (
                                    filteredTransfers.map((transfer) => {
                                        const matchesSourceAccount = accounts.find(account => account.account_id === transfer.source_account_id);
                                        const matchesDestinationAccount = accounts.find(account => account.account_id === transfer.destination_account_id);
                                        const transferDate = transfer.date.toDate();
                                        const matchesDate = transferDate.toLocaleDateString("es-ES", {
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
                                                    <IonLabel>{matchesDate}</IonLabel>
                                                </div>
                                                <IonItem key={transfer.transfer_id} className="transfer-item" onClick={() => handleEditTransfer(transfer)}>
                                                    <div>
                                                        <FontAwesomeIcon icon={faArrowDown}></FontAwesomeIcon>
                                                    </div>
                                                    <div>
                                                        <IonLabel>{matchesSourceAccount?.name}</IonLabel>
                                                        <IonLabel>{matchesDestinationAccount?.name}</IonLabel>
                                                    </div>
                                                    <div slot='end'>
                                                        <IonLabel>{transfer.amount}</IonLabel>
                                                        <IonLabel>{transfer.converted_amount}</IonLabel>
                                                    </div>
                                                    <div slot='end'>
                                                        <IonLabel>{transfer.source_currency}</IonLabel>
                                                        <IonLabel>{transfer.destination_currency}</IonLabel>
                                                    </div>
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

                    {/* Abrir el modal para añadir transferencias */}
                    <IonFabButton color="medium" className='transfer-fab-button' onClick={() => setIsAddModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir transferencias */}
                <AddTransfer isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}></AddTransfer>

                {/* Modal para editar o eliminar transferencias */}
                <EditTransfer isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} transfer={selectedTransfer}></EditTransfer>
            </IonContent>
        </IonPage>
    );
}

export default Transfers;
