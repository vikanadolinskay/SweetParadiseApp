import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getProducts } from '../../services/database';

const CatalogScreen = ({ navigation }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortOrder, setSortOrder] = useState('default');
    const [showSortMenu, setShowSortMenu] = useState(false);

    const categories = [
        { id: 'all', title: 'Все' },
        { id: 'cakes', title: 'Торты' },
        { id: 'pastries', title: 'Пирожные' },
        { id: 'desserts', title: 'Десерты' },
    ];

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        let result = [...products];

        if (selectedCategory !== 'all') {
            result = result.filter(p => p.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(query));
        }

        switch (sortOrder) {
            case 'price_asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'discount':
                result.sort((a, b) => (b.discount || 0) - (a.discount || 0));
                break;
            default:
                result.sort((a, b) => a.product_id - b.product_id);
        }

        setFilteredProducts(result);
    }, [products, selectedCategory, searchQuery, sortOrder]);

    const loadProducts = async() => {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setLoading(false);
    };

    const getFinalPrice = (product) => {
        if (product.discount && product.discount > 0) {
            return product.price * (100 - product.discount) / 100;
        }
        return product.price;
    };

    const renderProduct = ({ item }) => {
        const finalPrice = getFinalPrice(item);

        return ( <
            TouchableOpacity style = { styles.card }
            onPress = {
                () => navigation.navigate('ProductDetail', { productId: item.product_id }) }
            activeOpacity = { 0.7 } >
            <
            Image source = {
                { uri: item.image_url || 'https://via.placeholder.com/150' } }
            style = { styles.image }
            /> <
            View style = { styles.cardContent } >
            <
            Text style = { styles.name }
            numberOfLines = { 2 } > { item.name } <
            /Text> <
            View style = { styles.priceRow } > {
                item.discount && item.discount > 0 ? ( <
                    >
                    <
                    Text style = { styles.oldPrice } > { item.price }₽ < /Text> <
                    Text style = { styles.price } > { Math.round(finalPrice) }₽ < /Text> <
                    View style = { styles.discountBadge } >
                    <
                    Text style = { styles.discountText } > -{ item.discount } % < /Text> <
                    /View> <
                    />
                ) : ( <
                    Text style = { styles.price } > { item.price }₽ < /Text>
                )
            } <
            /View> {
                item.is_customizable === 1 && ( <
                    View style = { styles.customizableBadge } >
                    <
                    Icon name = "build"
                    size = { 12 }
                    color = "#D2691E" / >
                    <
                    Text style = { styles.customizableText } > Можно настроить < /Text> <
                    /View>
                )
            } <
            /View> <
            /TouchableOpacity>
        );
    };

    const renderCategory = ({ item }) => ( <
        TouchableOpacity style = {
            [styles.categoryChip, selectedCategory === item.id && styles.categoryChipActive] }
        onPress = {
            () => setSelectedCategory(item.id) } >
        <
        Text style = {
            [styles.categoryText, selectedCategory === item.id && styles.categoryTextActive] } > { item.title } <
        /Text> <
        /TouchableOpacity>
    );

    const handleSort = (order) => {
        setSortOrder(order);
        setShowSortMenu(false);
    };

    if (loading) {
        return ( <
            View style = { styles.center } >
            <
            ActivityIndicator size = "large"
            color = "#D2691E" / >
            <
            /View>
        );
    }

    return ( <
        View style = { styles.container } > { /* Строка поиска */ } <
        View style = { styles.searchContainer } >
        <
        Icon name = "search"
        size = { 20 }
        color = "#999"
        style = { styles.searchIcon }
        /> <
        TextInput style = { styles.searchInput }
        placeholder = "Поиск десертов..."
        placeholderTextColor = "#999"
        value = { searchQuery }
        onChangeText = { setSearchQuery }
        /> {
            searchQuery.length > 0 && ( <
                TouchableOpacity onPress = {
                    () => setSearchQuery('') } >
                <
                Icon name = "close"
                size = { 20 }
                color = "#999" / >
                <
                /TouchableOpacity>
            )
        } <
        /View>

        { /* Категории */ } <
        FlatList horizontal showsHorizontalScrollIndicator = { false }
        data = { categories }
        renderItem = { renderCategory }
        keyExtractor = {
            (item) => item.id }
        contentContainerStyle = { styles.categoriesList }
        />

        { /* Кнопка сортировки */ } <
        View style = { styles.sortContainer } >
        <
        TouchableOpacity style = { styles.sortButton }
        onPress = {
            () => setShowSortMenu(!showSortMenu) } >
        <
        Icon name = "sort"
        size = { 20 }
        color = "#D2691E" / >
        <
        Text style = { styles.sortButtonText } > Сортировка < /Text> <
        /TouchableOpacity> {
            showSortMenu && ( <
                View style = { styles.sortMenu } >
                <
                TouchableOpacity style = { styles.sortMenuItem }
                onPress = {
                    () => handleSort('default') } >
                <
                Text style = { styles.sortMenuItemText } > По умолчанию < /Text> <
                /TouchableOpacity> <
                TouchableOpacity style = { styles.sortMenuItem }
                onPress = {
                    () => handleSort('price_asc') } >
                <
                Text style = { styles.sortMenuItemText } > Сначала дешевле < /Text> <
                /TouchableOpacity> <
                TouchableOpacity style = { styles.sortMenuItem }
                onPress = {
                    () => handleSort('price_desc') } >
                <
                Text style = { styles.sortMenuItemText } > Сначала дороже < /Text> <
                /TouchableOpacity> <
                TouchableOpacity style = { styles.sortMenuItem }
                onPress = {
                    () => handleSort('discount') } >
                <
                Text style = { styles.sortMenuItemText } > По размеру скидки < /Text> <
                /TouchableOpacity> <
                /View>
            )
        } <
        /View>

        { /* Список товаров */ } <
        FlatList data = { filteredProducts }
        keyExtractor = {
            (item) => item.product_id.toString() }
        renderItem = { renderProduct }
        contentContainerStyle = { styles.list }
        showsVerticalScrollIndicator = { false }
        ListEmptyComponent = { <
            View style = { styles.emptyContainer } >
            <
            Text style = { styles.emptyText } > Ничего не найдено < /Text> <
            /View>
        }
        /> <
        /View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        margin: 10,
        paddingHorizontal: 12,
        height: 45,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    categoriesList: {
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginHorizontal: 4,
    },
    categoryChipActive: {
        backgroundColor: '#D2691E',
    },
    categoryText: {
        fontSize: 14,
        color: '#666',
    },
    categoryTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    sortContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        marginBottom: 8,
        position: 'relative',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D2691E',
    },
    sortButtonText: {
        fontSize: 14,
        color: '#D2691E',
        marginLeft: 4,
    },
    sortMenu: {
        position: 'absolute',
        top: 35,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 100,
    },
    sortMenuItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sortMenuItemText: {
        fontSize: 14,
        color: '#333',
    },
    list: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: '#f5f5f5',
    },
    cardContent: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 6,
    },
    oldPrice: {
        fontSize: 13,
        color: '#999',
        textDecorationLine: 'line-through',
        marginRight: 8,
    },
    price: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#D2691E',
    },
    discountBadge: {
        backgroundColor: '#FFE4E1',
        borderRadius: 12,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    discountText: {
        fontSize: 10,
        color: '#D2691E',
        fontWeight: 'bold',
    },
    customizableBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    customizableText: {
        fontSize: 11,
        color: '#D2691E',
        marginLeft: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});

export default CatalogScreen;