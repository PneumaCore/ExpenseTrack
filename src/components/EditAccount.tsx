import { faBitcoin, faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faCoins, faCreditCard, faHandHoldingDollar, faLandmark, faMoneyBill, faPiggyBank, faReceipt, faSackDollar, faScaleBalanced, faStamp, faVault, faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonButton, IonCol, IonContent, IonFooter, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonSelect, IonSelectOption, IonTitle, IonToolbar } from "@ionic/react";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { chevronBack } from "ionicons/icons";
import { useEffect, useState } from "react";
import { database } from "../configurations/firebase";
import "./EditAccount.css";

interface EditAccountProps {
    isOpen: boolean;
    onClose: () => void;
    account: Account | null;
}

interface Account {
    account_id: string,
    user_id: string,
    name: string,
    currency: string,
    balance: number,
    icon: string,
    color: string
}

interface Currency {
    code: string;
    name: string;
}

const icons = [
    faWallet, faCoins, faMoneyBill, faLandmark, faVault, faPiggyBank, faHandHoldingDollar, faSackDollar, faCreditCard, faBitcoin, faEthereum, faReceipt, faStamp, faScaleBalanced
];

const colors = [
    '#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1',
    '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9e9e9e',
    '#00bcd4', '#8bc34a'
];

const EditAccount: React.FC<EditAccountProps> = ({ isOpen, onClose, account }) => {
    const [name, setName] = useState('');
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<string | undefined>();
    const [balance, setBalance] = useState(0);
    const [icon, setIcon] = useState(faWallet);
    const [color, setColor] = useState('#000000');

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

    /* Actualizamos los campos con la información de la cuenta seleccionada */
    useEffect(() => {
        if (account) {
            setName(account.name);
            setSelectedCurrency(account.currency);
            setBalance(parseFloat(account.balance.toFixed(2)));
            setIcon(getFontAwesomeIcon(account.icon));
            setColor(account.color);
        }
    }, [account]);

    useEffect(() => {
        const fetchCurrencies = async () => {
            try {

                /* Obtenemos las divisas */
                const currenciesRef = await getDocs(collection(database, 'currencies'));
                const currencyList: Currency[] = currenciesRef.docs.map((doc) => doc.data() as Currency);

                setCurrencies(currencyList);
            } catch (error) {
                console.error('Error al obtener las divisas:', error);
            }
        };

        fetchCurrencies();
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

    const handleSaveAccount = async () => {
        try {

            if (!account?.account_id) {
                throw new Error("El ID de la cuenta no está definido");
            }

            const categoriesRef = doc(database, 'accounts', account?.account_id);

            const updateAccount = {
                name: name,
                currency: selectedCurrency,
                balance: parseFloat(balance.toFixed(2)),
                icon: icon.iconName,
                color: color
            }

            /* Guardamos la cuenta editada en la base de datos */
            await updateDoc(categoriesRef, updateAccount);

            setToastConfig({ isOpen: true, message: 'Cuenta editada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al editar la cuenta */
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo editar la cuenta', type: 'error' });
        }
    }

    const handleDeleteAccount = async () => {
        try {

            if (!account?.account_id) {
                throw new Error("El ID de la cuenta no está definido");
            }

            /* Buscamos en la base de datos las transacciones que estuvieran asociadas a la cuenta  */
            const transactionsRef = collection(database, 'transactions');

            const transactionsQuery = query(transactionsRef, where("account_id", "==", account.account_id));
            const querySnapshot = await getDocs(transactionsQuery);

            /* Eliminamos las transacciones  */
            for (const transactionDoc of querySnapshot.docs) {
                await deleteDoc(transactionDoc.ref);
            }

            /* Buscamos en la base de datos las transferencias que estuvieran asociadas a la cuenta  */
            const transfersRef = collection(database, 'transfers');

            const sourceTransfersQuery = query(transfersRef, where("source_account_id", "==", account.account_id));
            const querySnapshotSourceTransfers = await getDocs(sourceTransfersQuery);

            const destinationTransfersQuery = query(transfersRef, where("destination_account_id", "==", account.account_id));
            const querySnapshotDestinationTransfers = await getDocs(destinationTransfersQuery);

            /* Eliminamos las transferencias es la cuenta de origen  */
            for (const transferDoc of querySnapshotSourceTransfers.docs) {
                await deleteDoc(transferDoc.ref);
            }

            /* Eliminamos las transferencias es la cuenta de destino  */
            for (const transferDoc of querySnapshotDestinationTransfers.docs) {
                await deleteDoc(transferDoc.ref);
            }

            const accountRef = doc(database, 'accounts', account.account_id);

            /* Eliminamos la cuenta de la base de datos */
            await deleteDoc(accountRef);

            setToastConfig({ isOpen: true, message: 'Cuenta eliminada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al eliminar la cuenta */
            onClose();
        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo eliminar la cuenta', type: 'error' });
        }
    }

    return (
        <IonModal isOpen={isOpen} onDidDismiss={onClose}>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Editar cuenta</IonTitle>
                    <IonButton slot="start" onClick={onClose} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonGrid>

                    {/* Campo para añadir el nombre de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para seleccionar la divisa de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <IonSelect interface="popover" label="Divisa" labelPlacement="floating" placeholder="Selecciona una divisa" value={selectedCurrency} onIonChange={(e) => setSelectedCurrency(e.detail.value)}>
                                    {currencies.map(currency => (
                                        <IonSelectOption key={currency.code} value={currency.code}>
                                            <IonLabel>{currency.name} ({currency.code})</IonLabel>
                                        </IonSelectOption>
                                    ))}
                                </IonSelect>
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para introducir el balance de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2" className='account-setup-currency'>
                            <IonItem style={{ width: '100%' }}>
                                <IonInput placeholder='0' type="number" value={balance} onIonChange={(e) => setBalance(parseFloat(e.detail.value!) || 0)} required />
                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para la selección de icono de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <div className="account-icon-picker-container">
                                    <IonLabel>Selecciona un icono</IonLabel>
                                    <div>
                                        {icons.map((faIcon, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setIcon(faIcon)}
                                                className={`account-icon-container ${icon === faIcon ? 'selected' : ''}`}
                                            >
                                                <FontAwesomeIcon icon={faIcon} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </IonItem>
                        </IonCol>
                    </IonRow>

                    {/* Campo para la selección de color de la cuenta */}
                    <IonRow>
                        <IonCol size="12" size-md="8" offset-md="2">
                            <IonItem>
                                <div className="account-color-picker-container">
                                    <IonLabel>Selecciona un color</IonLabel>
                                    <div>
                                        {colors.map((colorOption, index) => (
                                            <div
                                                key={index}
                                                onClick={() => setColor(colorOption)}
                                                className={`account-color-container ${color === colorOption ? 'selected' : ''}`}
                                                style={{ backgroundColor: colorOption }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </IonItem>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
            <IonFooter>
                <IonToolbar>
                    <div className='add-account-footer'>

                        {/* Botón para guardar la cuenta */}
                        <IonButton onClick={handleSaveAccount}>Guardar cuenta</IonButton>

                        {/* Botón para eliminar la cuenta */}
                        <IonButton className='handle-delete-account-button' color='danger' onClick={handleDeleteAccount}>Eliminar cuenta</IonButton>
                    </div>
                </IonToolbar>
            </IonFooter>
        </IonModal >
    );
}

export default EditAccount;