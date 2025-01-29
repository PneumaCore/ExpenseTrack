import { faBook, faBriefcase, faBriefcaseMedical, faBuilding, faBus, faCar, faChalkboardTeacher, faChartBar, faChartLine, faCoins, faCreditCard, faFilm, faGasPump, faGift, faGraduationCap, faHandHoldingHeart, faHandHoldingUsd, faHome, faLaptop, faLightbulb, faMoneyBillWave, faMusic, faPiggyBank, faPills, faPuzzlePiece, faQuestion, faReceipt, faShoppingBag, faShoppingBasket, faShoppingCart, faSyncAlt, faTools, faTrophy, faUserMd, faUtensils, faWrench } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IonButtons, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonLabel, IonMenuButton, IonPage, IonRow, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from "@ionic/react";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, or, query, where } from "firebase/firestore";
import { add } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import AddCategory from "../components/AddCategory";
import EditCategory from "../components/EditCategory";
import { database } from "../configurations/firebase";
import "./Categories.css";

interface Category {
    category_id: string,
    user_id: string,
    name: string,
    type: string,
    icon: string,
    color: string
}

const Categories: React.FC = () => {
    const history = useHistory();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [type, setType] = useState('gasto');
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    {/* Filtramos las categorías según el tipo de la transacción */ }
    const filteredCategories = categories.filter(category => category.type === type);

    useEffect(() => {
        const fetchCategories = () => {
            try {

                /* Obtenemos los datos del usuario autenticado */
                const auth = getAuth();
                const currentUser = auth.currentUser;

                /* Obtenemos las categorías asociadas al usuario autenticado y los globales */
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

    const handleEditCategory = (category: Category) => {
        if (category.name === 'Otros') {
            return;
        }
        setSelectedCategory(category);
        setIsEditModalOpen(true);
    };

    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonMenuButton></IonMenuButton>
                    </IonButtons>
                    <IonTitle>Categorías</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>

                {/* Seleccionamos el tipo de transacción */}
                <IonSegment value={type} onIonChange={(e: CustomEvent) => setType(e.detail.value)}>
                    <IonSegmentButton value="gasto">
                        <IonLabel>Gasto</IonLabel>
                    </IonSegmentButton>
                    <IonSegmentButton value="ingreso">
                        <IonLabel>Ingreso</IonLabel>
                    </IonSegmentButton>
                </IonSegment>
                <IonGrid>
                    <IonRow>

                        {/* Se mapean las categorías, si no hay, se muestra que no hay categorías */}
                        {categories.length === 0 ? (
                            <IonCol className="category-col">
                                <IonLabel>No hay categorías</IonLabel>
                            </IonCol>
                        ) : (
                            filteredCategories.map((category) => (
                                <IonCol key={category.category_id} size="3" className="category-col" onClick={() => handleEditCategory(category)}>
                                    <div className="category-circle" style={{ backgroundColor: category.color }}>
                                        <FontAwesomeIcon icon={getFontAwesomeIcon(category.icon)} className="category-icon" />
                                    </div>
                                    <IonLabel className="category-label">{category.name}</IonLabel>
                                </IonCol>
                            ))
                        )}
                    </IonRow>
                </IonGrid>
                <IonFab slot="fixed" vertical="bottom" horizontal="center">

                    {/* Abrir el modal para añadir categorías */}
                    <IonFabButton color="medium" className="category-fab-button" onClick={() => setIsAddModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir categorías */}
                <EditCategory isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} category={selectedCategory}></EditCategory>
                <AddCategory isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}></AddCategory>
            </IonContent>
        </IonPage>
    );
}

export default Categories;