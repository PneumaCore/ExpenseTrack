import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faReceipt, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IonButton, IonCol, IonContent, IonGrid, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonModal, IonRow, IonTitle, IonToolbar } from '@ionic/react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

interface Category {
    category_id: string,
    user_id: string,
    name: string,
    type: string,
    icon: string,
    color: string
}

const EditCategory: React.FC<AddCategoryProps> = ({ isOpen, onClose, category }) => {
    const [type, setType] = useState(category?.type || 'gasto');
    const [name, setName] = useState(category?.name || '');
    const [color, setColor] = useState(category?.color || '#000000');

    /* Notificación global */
    const [toastConfig, setToastConfig] = useState<{
        isOpen: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ isOpen: false, message: '', type: 'error' });

    /* Actualizamos los campos con la información de la categoría seleccionada */
    useEffect(() => {
        if (category) {
            setType(category.type);
            setName(category.name);
            setIcon(getFontAwesomeIcon(category.icon));
            setColor(category.color);
        }
    }, [category]);

    const handleSaveCategory = async () => {
        try {

            if (!category?.category_id) {
                throw new Error("El ID de la categoría no está definido");
            }

            const categoriesRef = doc(database, 'categories', category.category_id);

            const updateCategory = {
                name: name,
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

    const [icon, setIcon] = useState(getFontAwesomeIcon(category?.icon || 'home'));

    return (
        <>
            <IonModal isOpen={isOpen} onDidDismiss={onClose}>
                <IonHeader>
                    <IonToolbar>
                        <IonTitle>Editar categoría</IonTitle>
                        <IonButton slot="start" onClick={onClose} fill='clear'>
                            <IonIcon icon={chevronBack}></IonIcon>
                        </IonButton>
                    </IonToolbar>
                </IonHeader>
                <IonContent>

                    {/* Pantalla para los gastos */}
                    {type === 'gasto' ? (
                        <IonGrid>

                            {/* Campo para añadir el nombre de la categoría */}
                            <IonRow>
                                <IonCol size="12" size-md="8" offset-md="2">
                                    <IonItem>
                                        <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
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
                                                {[
                                                    faHome,
                                                    faLightbulb,
                                                    faTools,
                                                    faGasPump,
                                                    faBus,
                                                    faWrench,
                                                    faCar,
                                                    faShoppingCart,
                                                    faUtensils,
                                                    faBriefcaseMedical,
                                                    faPills,
                                                    faUserMd,
                                                    faFilm,
                                                    faMusic,
                                                    faPuzzlePiece,
                                                    faGraduationCap,
                                                    faBook,
                                                    faChalkboardTeacher,
                                                    faCreditCard,
                                                    faMoneyBillWave,
                                                    faPiggyBank,
                                                    faChartLine,
                                                    faGift,
                                                    faHandHoldingHeart,
                                                    faShoppingBag
                                                ].map((faIcon, index) => (
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
                                                {['#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1', '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9e9e9e', '#00bcd4', '#8bc34a'].map(
                                                    (colorOption, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => setColor(colorOption)}
                                                            className={`color-container ${color === colorOption ? 'selected' : ''
                                                                }`}
                                                            style={{ backgroundColor: colorOption }}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>

                                    </IonItem>
                                </IonCol>
                            </IonRow>

                            {/* Botón para guardar la categoría */}
                            <IonRow>
                                <IonCol>
                                    <IonButton expand='full' onClick={handleSaveCategory}>Guardar categoría</IonButton>
                                </IonCol>
                            </IonRow>

                            {/* Botón para eliminar la categoría */}
                            <IonRow>
                                <IonCol>
                                    <IonButton className='handle-delete-button' expand='full' color='danger' onClick={handleDeleteCategory}>Eliminar categoría</IonButton>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    ) : (
                        <IonGrid>

                            {/* Campo para añadir el nombre de la categoría */}
                            <IonRow>
                                <IonCol size="12" size-md="8" offset-md="2">
                                    <IonItem>
                                        <IonInput label='Nombre' labelPlacement='floating' placeholder='Nombre' value={name} onIonChange={(e) => setName(e.detail.value!)} required />
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
                                                {[
                                                    faBriefcase,
                                                    faHandHoldingUsd,
                                                    faLaptop,
                                                    faShoppingBasket,
                                                    faCoins,
                                                    faChartBar,
                                                    faBuilding,
                                                    faGift,
                                                    faSyncAlt,
                                                    faTrophy,
                                                    faReceipt
                                                ].map((faIcon, index) => (
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
                                                {['#ff6347', '#3b82f6', '#34d399', '#f59e0b', '#e11d48', '#6366f1', '#9c27b0', '#4caf50', '#ff9800', '#2196f3', '#f44336', '#9e9e9e', '#00bcd4', '#8bc34a'].map(
                                                    (colorOption, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => setColor(colorOption)}
                                                            className={`color-container ${color === colorOption ? 'selected' : ''
                                                                }`}
                                                            style={{ backgroundColor: colorOption }}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>

                                    </IonItem>
                                </IonCol>
                            </IonRow>

                            {/* Botón para guardar la categoría */}
                            <IonRow>
                                <IonCol>
                                    <IonButton className='handle-category-button' expand='full' onClick={handleSaveCategory}>Guardar categoría</IonButton>
                                </IonCol>
                            </IonRow>

                            {/* Botón para eliminar la categoría */}
                            <IonRow>
                                <IonCol>
                                    <IonButton className='handle-delete-button' expand='full' color='danger' onClick={handleDeleteCategory}>Eliminar categoría</IonButton>
                                </IonCol>
                            </IonRow>
                        </IonGrid>
                    )}
                </IonContent>
            </IonModal>
            <GlobalToast isOpen={toastConfig.isOpen} message={toastConfig.message} type={toastConfig.type} onDidDismiss={() => { setToastConfig({ ...toastConfig, isOpen: false }); }}></GlobalToast>
        </>
    );
};

export default EditCategory;