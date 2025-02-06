import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faFilm, faFloppyDisk, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faQuestion, faReceipt, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrashCan, faTrophy, faUserMd, faUtensils, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonAlert, IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { chevronBack } from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import { database } from '../configurations/firebase';
import './AddCategory.css';
import GlobalToast from './GlobalToast';

interface AddCategoryProps {
    isOpen: boolean;
    onClose: () => void;
    category: Category | null;
}

const icons: { gasto: IconDefinition[]; ingreso: IconDefinition[] } = {
    gasto: [
        faHome, faLightbulb, faTools, faGasPump, faBus, faWrench, faCar,
        faShoppingCart, faUtensils, faBriefcaseMedical, faPills, faUserMd,
        faFilm, faMusic, faPuzzlePiece, faGraduationCap, faBook, faChalkboardTeacher,
        faCreditCard, faMoneyBillWave, faPiggyBank, faChartLine, faGift,
        faHandHoldingHeart, faShoppingBag
    ],
    ingreso: [
        faBriefcase, faHandHoldingUsd, faLaptop, faShoppingBasket, faCoins,
        faChartBar, faBuilding, faGift, faSyncAlt, faTrophy, faReceipt
    ]
};

type CategoryType = keyof typeof icons;

const colors = [
    '#395659', '#99BFBF', '#BAD9D9', '#F2BB77', '#D9AB82', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9', '#92A8D1',
    '#955251', '#B565A7', '#009B77', '#DD4124', '#D65076', '#45B8AC', '#EFC050', '#5B5EA6', '#FFB3BA', '#FFDFBA',
    '#FFFFBA', '#BAFFC9', '#BAE1FF', '#C0C0C0', '#FFD700', '#40E0D0', '#FF69B4', '#8A2BE2', '#00CED1', '#FF4500'
];

interface Category {
    category_id: string,
    user_id: string,
    name: string,
    mensualBudget: number,
    type: string,
    icon: string,
    color: string
}

const EditCategory: React.FC<AddCategoryProps> = ({ isOpen, onClose, category }) => {
    const [error, setError] = useState<string>('');
    const [showAlert, setShowAlert] = useState(false);
    const [type, setType] = useState<CategoryType>('gasto');
    const [name, setName] = useState('');
    const [mensualBudget, setMensualBudget] = useState(0);
    const [icon, setIcon] = useState(faQuestion);
    const [color, setColor] = useState('#A9A9A9');

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

    /* Actualizamos los campos con la información de la categoría seleccionada */
    useEffect(() => {
        if (category) {
            setType(category.type === 'gasto' || category.type === 'ingreso' ? category.type : 'gasto');
            setName(category.name);
            setMensualBudget(category.mensualBudget);
            setIcon(getFontAwesomeIcon(category.icon));
            setColor(category.color);
        }
    }, [category]);

    const handleSaveCategory = async () => {

        /* Validamos que los datos sean válidos */
        if (!name) {
            setError('Introduce un nombre válido para la categoría');
            setShowAlert(true);
            return;
        }

        if (mensualBudget < 0) {
            setError('Introduce un presupuesto mensual válido para la categoría');
            setShowAlert(true);
            return;
        }

        if (icon === faQuestion) {
            setError('Selecciona un icono para la categoría');
            setShowAlert(true);
            return;
        }

        if (color === '#A9A9A9') {
            setError('Selecciona un color para la categoría');
            setShowAlert(true);
            return;
        }

        try {

            if (!category?.category_id) {
                throw new Error("El ID de la categoría no está definido");
            }

            const categoriesRef = doc(database, 'categories', category.category_id);

            const updateCategory = {
                name: name,
                mensualBudget: mensualBudget,
                type: type,
                icon: icon.iconName,
                color: color
            }

            /* Guardamos la categoría editada en la base de datos */
            await updateDoc(categoriesRef, updateCategory);

            setToastConfig({ isOpen: true, message: 'Categoría editada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al editar la categoría */
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo editar la categoría', type: 'error' });
        }
    };

    const handleDeleteCategory = async () => {
        try {

            if (!category?.category_id) {
                throw new Error("El ID de la categoría no está definido");
            }

            /* Buscamos en la base de datos las transacciones que estuvieran asociadas a la categoría  */
            const newCategoryId = category.type === "gasto" ? 'maDDc2ma6pMJFCTG3LKD' : 'rFA77FQ9wx9l8308us5S';
            const transactionsRef = collection(database, "transactions");
            const q = query(transactionsRef, where("category_id", "==", category.category_id));

            const querySnapshot = await getDocs(q);

            /* Actualizamos las categorías de las transacciones a una genérica para que no desaparezcan el icono y el nombre de la categoría de las transacciones*/
            const updatePromises = querySnapshot.docs.map(docSnapshot => {
                const transactionRef = doc(database, "transactions", docSnapshot.id);
                return updateDoc(transactionRef, { category_id: newCategoryId });
            });

            await Promise.all(updatePromises);

            const categoryRef = doc(database, 'categories', category.category_id);

            /* Eliminamos la categoría editada en la base de datos */
            await deleteDoc(categoryRef);

            setToastConfig({ isOpen: true, message: 'Categoría eliminada con éxito', type: 'success' });

            /* Cerramos el modal automáticamente al editar la categoría */
            onClose();

        } catch (error) {
            setToastConfig({ isOpen: true, message: 'No se pudo eliminar la categoría', type: 'error' });
        }
    };


    /* Mapeamos todos los iconos de las categorías */
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
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Editar categoría</IonTitle>
                        <IonButton slot="start" onClick={onClose} fill='clear'>
                            <IonIcon icon={chevronBack}></IonIcon>
                        </IonButton>

                        {/* Botón para guardar la categoría */}
                        <IonButton slot='end' fill='clear' onClick={handleSaveCategory}>
                            <FontAwesomeIcon icon={faFloppyDisk} />
                        </IonButton>

                        {/* Botón para eliminar la categoría */}
                        <IonButton slot='end' className='handle-delete-button' color='danger' fill='clear' onClick={handleDeleteCategory}>
                            <FontAwesomeIcon icon={faTrashCan} />
                        </IonButton>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <IonGrid>
                        {showAlert && (<IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={'Datos inválidos'} message={error} buttons={['Aceptar']} />)}

                        {/* Campo para añadir el nombre de la categoría */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonInput={(e) => setName(e.detail.value!)} required />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para añadir el presupuesto mensual de la categoría */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <IonInput label='Presupuesto mensual' labelPlacement='floating' placeholder='Presupuesto mensual' type='number' value={mensualBudget} onIonInput={(e) => setMensualBudget(parseFloat(e.detail.value!))} required />
                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para la selección de icono de la categoría */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <div className="icon-picker-container">
                                        <IonLabel>Selecciona un icono</IonLabel>
                                        <div>
                                            {icons[type].map((faIcon, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setIcon(faIcon)}
                                                    className={`icon-container ${icon === faIcon ? 'selected' : ''}`}
                                                >
                                                    <FontAwesomeIcon icon={faIcon} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </IonItem>
                            </IonCol>
                        </IonRow>

                        {/* Campo para la selección de color de la categoría */}
                        <IonRow>
                            <IonCol size="12" size-md="8" offset-md="2">
                                <IonItem>
                                    <div className="color-picker-container">
                                        <IonLabel>Selecciona un color</IonLabel>
                                        <div>
                                            {colors.map((colorOption, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => setColor(colorOption)}
                                                    className={`color-container ${color === colorOption ? 'selected' : ''}`}
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
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
        </>
    );
};

export default EditCategory;