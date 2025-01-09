import { faBitcoin, faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faCoins, faCreditCard, faHandHoldingDollar, faLandmark, faMoneyBill, faPiggyBank, faReceipt, faSackDollar, faScaleBalanced, faStamp, faVault, faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonButtons, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { add } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import AddAccount from "../components/AddAccount";
import EditAccount from "../components/EditAccount";
import { database } from "../configurations/firebase";
import "./Accounts.css";

interface Account {
    account_id: string,
    user_id: string,
    name: string,
    currency: string,
    balance: number,
    icon: string,
    color: string
}

const Accounts: React.FC = () => {
    const history = useHistory();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

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

    const getFontAwesomeIcon = (iconName: string) => {
        const icons: { [key: string]: any } = {
            'wallet': faWallet,
            'coins': faCoins,
            'money-bill': faMoneyBill,
            'landmark': faLandmark,
            'vault': faVault,
            'piggy-bank': faPiggyBank,
            'hand-holding-dollar': faHandHoldingDollar,
            'sack-dollar': faSackDollar,
            'credit-card': faCreditCard,
            'bitcoin': faBitcoin,
            'ethereum': faEthereum,
            'receipt': faReceipt,
            'stamp': faStamp,
            'scale-balanced': faScaleBalanced
        };
        return icons[iconName] || faWallet;
    }

    const handleEditAccount = (account: Account) => {
        setSelectedAccount(account);
        setIsEditModalOpen(true);
    };

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Cuentas</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>

                    {/* Listado de cuentas */}
                    <IonRow>
                        <IonCol>
                            <IonList>
                                {accounts.length === 0 ? (
                                    <IonItem className="account-message">
                                        <IonLabel>No hay cuentas</IonLabel>
                                    </IonItem>
                                ) : (
                                    accounts.map((account) => {
                                        return (
                                            <IonItem key={account.account_id} className="account-item" onClick={() => handleEditAccount(account)}>
                                                <div className="account-icon-circle" slot='start' style={{ backgroundColor: account?.color }}>
                                                    <FontAwesomeIcon icon={getFontAwesomeIcon(account.icon)} className="account-icon-font"></FontAwesomeIcon>
                                                </div>
                                                <IonLabel>{account.name}</IonLabel>
                                                <IonLabel slot="end">{account.balance}</IonLabel>
                                                <IonLabel slot="end">{account.currency}</IonLabel>
                                            </IonItem>
                                        );
                                    })
                                )}
                            </IonList>
                        </IonCol>
                    </IonRow>
                </IonGrid>
                <IonFab slot="fixed" vertical="bottom" horizontal="center">

                    {/* Abrir el modal para añadir cuentas */}
                    <IonFabButton onClick={() => setIsAddModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir cuentas */}
                <AddAccount isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}></AddAccount>

                {/* Modal para editar o eliminar cuentas */}
                <EditAccount isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} account={selectedAccount}></EditAccount>
            </IonContent>
        </IonPage>
    );
}

export default Accounts;