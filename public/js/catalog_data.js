/**
 * DULCE Y JALEO - Catálogo Base Profesional v2.0
 * Banco de datos de +150 productos para panaderías, cafeterías y pastelerías.
 */

const BASE_CATALOG_DATA = [
    // --- PANADERÍA (PREMIUM & TRADICIONAL) ---
    { id: "p1", name: "Barra de Pan Tradicional", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p2", name: "Barra Gallega", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p3", name: "Pan de Molde Artesano", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p4", name: "Chapatita", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p5", name: "Barra Integral", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p6", name: "Pan de Centeno", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p7", name: "Pan de Cereales", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p8", name: "Pan sin Sal", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p9", name: "Baguette", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p10", name: "Pan de Hamburguesa (Brioche)", unit: "Pack 4", category: "Panadería", icon: "package" },
    { id: "p11", name: "Focaccia de Hierbas", unit: "Ud", category: "Panadería", icon: "bread" },
    { id: "p12", name: "Pan de Cristal", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p13", name: "Pan de Maíz", unit: "Uds", category: "Panadería", icon: "bread" },
    { id: "p14", name: "Picos Artesanos", unit: "Bolsa", category: "Panadería", icon: "package" },
    { id: "p15", name: "Regañás Premium", unit: "Bolsa", category: "Panadería", icon: "package" },

    // --- BOLLERÍA (DULCE & SALADA) ---
    { id: "b1", name: "Croissant Mantequilla", unit: "Uds", category: "Bollería", icon: "croissant" },
    { id: "b2", name: "Napolitana Chocolate", unit: "Uds", category: "Bollería", icon: "package" },
    { id: "b3", name: "Napolitana Crema", unit: "Uds", category: "Bollería", icon: "package" },
    { id: "b4", name: "Ensaimada Individual", unit: "Uds", category: "Bollería", icon: "circle" },
    { id: "b5", name: "Palmera de Chocolate", unit: "Uds", category: "Bollería", icon: "package" },
    { id: "b6", name: "Palmera de Huevo", unit: "Uds", category: "Bollería", icon: "package" },
    { id: "b7", name: "Berlina de Azúcar", unit: "Uds", category: "Bollería", icon: "circle" },
    { id: "b8", name: "Berlina de Chocolate", unit: "Uds", category: "Bollería", icon: "circle" },
    { id: "b9", name: "Muffin Chocolate", unit: "Uds", category: "Bollería", icon: "package" },
    { id: "b10", name: "Muffin Arándanos", unit: "Uds", category: "Bollería", icon: "package" },
    { id: "b11", name: "Caracola de Pasas", unit: "Uds", category: "Bollería", icon: "refresh-cw" },
    { id: "b12", name: "Donut Glaseado", unit: "Uds", category: "Bollería", icon: "circle" },
    { id: "b13", name: "Croissant Almendrado", unit: "Uds", category: "Bollería", icon: "croissant" },
    { id: "b14", name: "Lazo de Hojaldre", unit: "Uds", category: "Bollería", icon: "hash" },
    { id: "b15", name: "Xuxo de Crema", unit: "Uds", category: "Bollería", icon: "battery" },

    // --- PASTELERÍA & REPOSTERÍA ---
    { id: "ps1", name: "Tarta de Queso", unit: "Porción", category: "Pastelería", icon: "pie-chart" },
    { id: "ps2", name: "Tarta de Manzana", unit: "Porción", category: "Pastelería", icon: "pie-chart" },
    { id: "ps3", name: "Brownie de Chocolate", unit: "Ud", category: "Pastelería", icon: "square" },
    { id: "ps4", name: "Brazo de Gitano", unit: "Ud", category: "Pastelería", icon: "minus" },
    { id: "ps5", name: "Pastel de Gloria", unit: "Ud", category: "Pastelería", icon: "star" },
    { id: "ps6", name: "Milhojas de Crema", unit: "Ud", category: "Pastelería", icon: "layers" },
    { id: "ps7", name: "Profiteroles", unit: "Docena", category: "Pastelería", icon: "circle" },
    { id: "ps8", name: "Tarta Red Velvet", unit: "Porción", category: "Pastelería", icon: "pie-chart" },
    { id: "ps9", name: "Eclair de Chocolate", unit: "Ud", category: "Pastelería", icon: "minus" },
    { id: "ps10", name: "Banda de Frutas", unit: "Ud", category: "Pastelería", icon: "grid" },

    // --- CAFETERÍA & INFUSIONES ---
    { id: "c1", name: "Café Espresso", unit: "Taza", category: "Cafetería", icon: "coffee" },
    { id: "c2", name: "Café con Leche", unit: "Taza", category: "Cafetería", icon: "coffee" },
    { id: "c3", name: "Capuchino", unit: "Taza", category: "Cafetería", icon: "coffee" },
    { id: "c4", name: "BICA / Cortado", unit: "Taza", category: "Cafetería", icon: "coffee" },
    { id: "c5", name: "Café Americano", unit: "Taza", category: "Cafetería", icon: "coffee" },
    { id: "c6", name: "Infusión Poleo Menta", unit: "Taza", category: "Cafetería", icon: "wind" },
    { id: "c7", name: "Infusión Manzanilla", unit: "Taza", category: "Cafetería", icon: "sun" },
    { id: "c8", name: "Té Rojo / Negro / Verde", unit: "Taza", category: "Cafetería", icon: "droplet" },
    { id: "c9", name: "Chocolate a la Taza", unit: "Taza", category: "Cafetería", icon: "coffee" },
    { id: "c10", name: "Colacao / Nesquik", unit: "Taza", category: "Cafetería", icon: "coffee" },
    { id: "c11", name: "Café Bombón", unit: "Vaso", category: "Cafetería", icon: "coffee" },
    { id: "c12", name: "Café con Hielo", unit: "Vaso", category: "Cafetería", icon: "ice-cream" },

    // --- BEBIDAS & REFRESCOS ---
    { id: "br1", name: "Agua Mineral 500ml", unit: "Botella", category: "Bebidas", icon: "droplet" },
    { id: "br2", name: "Agua Mineral 1.5L", unit: "Botella", category: "Bebidas", icon: "droplet" },
    { id: "br3", name: "Coca-Cola 330ml", unit: "Lata", category: "Bebidas", icon: "archive" },
    { id: "br4", name: "Coca-Cola Zero 330ml", unit: "Lata", category: "Bebidas", icon: "archive" },
    { id: "br5", name: "Fanta Naranja 330ml", unit: "Lata", category: "Bebidas", icon: "archive" },
    { id: "br6", name: "Fanta Limón 330ml", unit: "Lata", category: "Bebidas", icon: "archive" },
    { id: "br7", name: "Aquarius Limón", unit: "Lata", category: "Bebidas", icon: "archive" },
    { id: "br8", name: "Nestea Limón", unit: "Lata", category: "Bebidas", icon: "archive" },
    { id: "br9", name: "Zumo de Naranja Natural", unit: "Vaso", category: "Bebidas", icon: "droplet" },
    { id: "br10", name: "Zumo de Piña / Melocotón", unit: "Botellín", category: "Bebidas", icon: "droplet" },
    { id: "br11", name: "Cerveza Nacional 330ml", unit: "Botella", category: "Bebidas", icon: "beer" },
    { id: "br12", name: "Cerveza 0,0% 330ml", unit: "Botella", category: "Bebidas", icon: "beer" },

    // --- PRODUCTOS BASE & SUMINISTROS ---
    { id: "l1", name: "Leche Entera", unit: "L", category: "Suministros", icon: "droplet" },
    { id: "l2", name: "Leche Desnatada", unit: "L", category: "Suministros", icon: "droplet" },
    { id: "l3", name: "Leche Sin Lactosa", unit: "L", category: "Suministros", icon: "droplet" },
    { id: "l4", name: "Bebida de Avena / Soja", unit: "L", category: "Suministros", icon: "droplet" },
    { id: "l5", name: "Nata para Montar", unit: "L", category: "Suministros", icon: "droplet" },
    { id: "l6", name: "Huevos L", unit: "Docena", category: "Suministros", icon: "package" },
    { id: "l7", name: "Mantequilla Profesional", unit: "Kg", category: "Suministros", icon: "square" },
    { id: "l8", name: "Harina de Fuerza", unit: "Saco 25kg", category: "Suministros", icon: "archive" },
    { id: "l9", name: "Levadura Prensada", unit: "Bloque", category: "Suministros", icon: "package" },
    { id: "l10", name: "Azúcar Blanco", unit: "Bolsa 1kg", category: "Suministros", icon: "package" },

    // --- SALADO / SNACKS / COMIDA RÁPIDA ---
    { id: "s1", name: "Empanada Gallega Atún", unit: "Porción", category: "Salado", icon: "pie-chart" },
    { id: "s2", name: "Empanada Carne", unit: "Porción", category: "Salado", icon: "pie-chart" },
    { id: "s3", name: "Hojaldre de Salchicha", unit: "Ud", category: "Salado", icon: "package" },
    { id: "s4", name: "Bocadillo Jamón Ibérico", unit: "Ud", category: "Salado", icon: "bread" },
    { id: "s5", name: "Bocadillo Queso / Mixto", unit: "Ud", category: "Salado", icon: "bread" },
    { id: "s6", name: "Tortilla de Patata", unit: "Pincho", category: "Salado", icon: "circle" },
    { id: "s7", name: "Sándwich Vegetal", unit: "Ud", category: "Salado", icon: "square" },
    { id: "s8", name: "Quiche de Verduras", unit: "Porción", category: "Salado", icon: "pie-chart" },
    { id: "s9", name: "Pizza Margarita", unit: "Porción", category: "Salado", icon: "pie-chart" },
    { id: "s10", name: "Croquetas de Jamón", unit: "Ración 6uds", category: "Salado", icon: "package" }
];

// Hacerlo disponible globalmente
window.BASE_CATALOG = BASE_CATALOG_DATA;
