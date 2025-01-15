import { faBitcoin, faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faArrowRightArrowLeft, faCoins, faCreditCard, faHandHoldingDollar, faHistory, faLandmark, faMoneyBill, faPiggyBank, faReceipt, faSackDollar, faScaleBalanced, faStamp, faVault, faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonButton, IonButtons, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonMenuButton, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { add } from "ionicons/icons";
import { useEffect, useState } from "react";
import AddAccount from "../components/AddAccount";
import EditAccount from "../components/EditAccount";
import { database } from "../configurations/firebase";
import "./Accounts.css";
import AddTransfer from "../components/AddTransfer";

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddTransferModalOpen, setIsAddTransferModalOpen] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [preferredCurrency, setPreferredCurrency] = useState<string>("EUR");
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const [totalBalanceInPreferredCurrency, setTotalBalanceInPreferredCurrency] = useState<number>(0);

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
                const response = await axios.get(
                    `https://api.exchangerate-api.com/v4/latest/${preferredCurrency}`
                );
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
        if (accounts.length > 0) {
            const total = accounts.reduce((sum, account) => {
                if (account.currency === preferredCurrency) {
                    return sum + account.balance;
                }

                const rate = exchangeRates[account.currency];
                if (rate) {
                    return sum + account.balance / rate;
                }
                return sum;
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

                    {/* Mostramos el saldo total de todas las cuentas */}
                    <IonRow>
                        <IonCol>
                            <div className="account-total-balance">
                                <IonLabel>Total:</IonLabel>
                                <IonLabel>{totalBalanceInPreferredCurrency.toFixed(2)} {preferredCurrency}</IonLabel>
                            </div>
                        </IonCol>
                    </IonRow>

                    {/* Mostramos el saldo total de todas las cuentas */}
                    <IonRow>
                        <IonCol>
                            <div className="account-historial-new-transfer-buttons">
                                <div className="account-historial-transfer-button">
                                    <IonButton>
                                        <FontAwesomeIcon icon={faHistory}></FontAwesomeIcon>
                                    </IonButton>
                                    <IonLabel>Historial de transferencias</IonLabel>
                                </div>
                                <div className="account-new-transfer-button">
                                    <IonButton onClick={() => setIsAddTransferModalOpen(true)}>
                                        <FontAwesomeIcon icon={faArrowRightArrowLeft}></FontAwesomeIcon>
                                    </IonButton>
                                    <IonLabel>Nueva transferencia</IonLabel>
                                </div>
                            </div>
                        </IonCol>
                    </IonRow>

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
                                                <IonLabel slot="end">{account.balance.toFixed(2)}</IonLabel>
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

                {/* Modal para añadir transferencias */}
                <AddTransfer isOpen={isAddTransferModalOpen} onClose={() => setIsAddTransferModalOpen(false)}></AddTransfer>
            </IonContent>
        </IonPage>
    );
}

export default Accounts;