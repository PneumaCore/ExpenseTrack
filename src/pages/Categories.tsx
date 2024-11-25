import { IonButton, IonCol, IonContent, IonFab, IonFabButton, IonGrid, IonHeader, IonIcon, IonItem, IonLabel, IonPage, IonRow, IonTitle, IonToolbar } from "@ionic/react";
import { add, chevronBack } from "ionicons/icons";
import { useEffect, useState } from "react";
import { useHistory } from "react-router";
import AddCategory from "../components/AddCategory";
import "./Categories.css";
import { getAuth } from "firebase/auth";
import { database } from "../configurations/firebase";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        const fetchCategories = () => {

            /* Obtenemos los datos del usuario autenticado */
            const auth = getAuth();
            const currentUser = auth.currentUser;

            /* Obtenemos las categorías asociadas al usuario autenticado */
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
        };

        const unsubscribe = fetchCategories();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);


    return (
        <IonPage id="main-content">
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Categorías</IonTitle>
                    <IonButton slot="start" onClick={() => history.goBack()} fill='clear'>
                        <IonIcon icon={chevronBack}></IonIcon>
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <IonGrid>
                    <IonRow>
                        {categories.length === 0 ? (
                            <IonCol>
                                <IonLabel>No hay categorías</IonLabel>
                            </IonCol>
                        ) : (
                            categories.map((category) => (
                                <IonCol key={category.category_id} size="4" className="category-col">
                                    <div
                                        className="category-circle"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        <IonIcon icon={category.icon} className="category-icon" />
                                    </div>
                                    <IonLabel className="category-label">{category.name}</IonLabel>
                                </IonCol>
                            ))
                        )}
                    </IonRow>
                </IonGrid>
                <IonFab slot="fixed" vertical="bottom" horizontal="center">

                    {/* Abrir el modal para añadir categorías */}
                    <IonFabButton onClick={() => setIsModalOpen(true)}>
                        <IonIcon icon={add}></IonIcon>
                    </IonFabButton>
                </IonFab>

                {/* Modal para añadir categorías */}
                <AddCategory isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}></AddCategory>
            </IonContent>
        </IonPage>
    );
}

export default Categories;