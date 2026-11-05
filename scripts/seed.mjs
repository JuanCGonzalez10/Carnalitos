import { Client } from "pg";
import { scryptSync, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { databaseUrl, sslConfig } from "./db-config.mjs";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const categories = [
  {
    slug: "snacks-naturales",
    name: "Snacks naturales",
    description: "Premios horneados y deshidratados con proteína real, ideales para el día a día.",
    icon: "bone",
    sort: 1,
  },
  {
    slug: "comida-saludable",
    name: "Comida saludable",
    description: "Recetas completas y balanceadas para perros y gatos, con ingredientes visibles.",
    icon: "utensils",
    sort: 2,
  },
  {
    slug: "premios-entrenamiento",
    name: "Premios de entrenamiento",
    description: "Porciones pequeñas y aromáticas para reforzar buenos comportamientos.",
    icon: "star",
    sort: 3,
  },
  {
    slug: "para-gatos",
    name: "Para gatos",
    description: "Snacks y comida pensada para el paladar felino y su digestión.",
    icon: "heart",
    sort: 4,
  },
  {
    slug: "masticables",
    name: "Masticables",
    description: "Opciones duraderas que ayudan a la limpieza dental y al entretenimiento.",
    icon: "paw",
    sort: 5,
  },
];

const products = [
  {
    slug: "hueso-de-pollo-desecado",
    name: "Hueso de pollo desecado",
    category: "snacks-naturales",
    short: "Pechuga de pollo deshidratada en forma de hueso, crujiente y sin aditivos.",
    description:
      "Un premio sencillo y honesto: pechuga de pollo seleccionada, deshidratada lentamente para conservar su aroma y su textura crujiente. No lleva conservantes, colorantes ni saborizantes.\n\nEs perfecto como premio diario o para mantener a tu perro entretenido. Por su textura firme, también funciona muy bien para perros que mastican con entusiasmo.",
    price: 18900,
    compare: 22000,
    stock: 40,
    sku: "CAR-SN-001",
    unit: "paquete",
    weight: "120 g",
    pet: "perro",
    benefits: ["Alta en proteína", "Sin conservantes", "Textura crujiente", "Hecho en lotes pequeños"],
    ingredients: "Pechuga de pollo 100%.",
    image: "/images/productos/hueso-pollo.svg",
    featured: true,
    sort: 1,
  },
  {
    slug: "chips-de-higado-de-res",
    name: "Chips de hígado de res",
    category: "snacks-naturales",
    short: "Láminas finas de hígado deshidratado, intensas en sabor y hierro.",
    description:
      "El hígado es uno de los ingredientes más aromáticos para los perros y una buena fuente natural de hierro y vitamina A. Lo cortamos en láminas finas y lo deshidratamos hasta lograr un snack ligero y quebradizo.\n\nÚsalo como premio de alto valor en entrenamientos o para romper la rutina. Por su intensidad, recomendamos darlo en porciones pequeñas.",
    price: 16500,
    compare: null,
    stock: 32,
    sku: "CAR-SN-002",
    unit: "paquete",
    weight: "80 g",
    pet: "perro",
    benefits: ["Rico en hierro", "Muy aromático", "Ideal para entrenar", "Sin cereales"],
    ingredients: "Hígado de res 100%.",
    image: "/images/productos/chips-higado.svg",
    featured: true,
    sort: 2,
  },
  {
    slug: "galletas-de-avena-y-miel",
    name: "Galletas de avena y miel",
    category: "premios-entrenamiento",
    short: "Galletas horneadas con avena integral y un toque de miel, tamaño bocado.",
    description:
      "Una receta casera convertida en galleta: avena integral, huevo y un toque de miel. Horneamos cada lote hasta que queda firme por fuera y suave por dentro.\n\nEl tamaño bocado las hace ideales para premios frecuentes y para perros de todos los tamaños. También son una buena opción para gatos curiosos, siempre en porciones pequeñas.",
    price: 14900,
    compare: null,
    stock: 48,
    sku: "CAR-PR-001",
    unit: "paquete",
    weight: "150 g",
    pet: "ambos",
    benefits: ["Avena integral", "Tamaño bocado", "Horneadas a mano", "Sin azúcar añadida"],
    ingredients: "Avena integral, huevo, miel, aceite de coco y canela.",
    image: "/images/productos/galletas-avena.svg",
    featured: true,
    sort: 3,
  },
  {
    slug: "croquetas-de-salmon",
    name: "Croquetas de salmón",
    category: "comida-saludable",
    short: "Comida completa para gatos con salmón, arroz integral y caldo de pescado.",
    description:
      "Una receta húmeda y aromática para gatos exigentes. El salmón aporta proteína de alta calidad y omega 3, mientras el arroz integral y las verduras completan una porción equilibrada.\n\nSe puede servir sola o mezclada con su comida habitual. Viene en porciones individuales para mantener la frescura.",
    price: 48900,
    compare: null,
    stock: 4,
    sku: "CAR-CO-001",
    unit: "paquete",
    weight: "500 g",
    pet: "gato",
    benefits: ["Omega 3", "Proteína de salmón", "Sin subproductos", "Porciones individuales"],
    ingredients: "Salmón, arroz integral, zanahoria, caldo de pescado y aceite de salmón.",
    image: "/images/productos/croquetas-salmon.svg",
    featured: true,
    sort: 4,
  },
  {
    slug: "pollo-con-verduras",
    name: "Pollo con verduras",
    category: "comida-saludable",
    short: "Receta completa de pollo, calabaza, zanahoria y arroz para perros.",
    description:
      "Comida cocinada a baja temperatura con pollo desmechado, calabaza, zanahoria y arroz integral. Una mezcla suave y fácil de digerir, pensada para perros de todas las edades.\n\nSirve como complemento de su alimentación o como comida completa según su tamaño y nivel de actividad. Consulta con tu veterinario si tu perro tiene necesidades especiales.",
    price: 42900,
    compare: 46900,
    stock: 18,
    sku: "CAR-CO-002",
    unit: "paquete",
    weight: "500 g",
    pet: "perro",
    benefits: ["Fácil de digerir", "Verduras reales", "Cocción suave", "Sin colorantes"],
    ingredients: "Pollo, calabaza, zanahoria, arroz integral y aceite de coco.",
    image: "/images/productos/pollo-verduras.svg",
    featured: true,
    sort: 5,
  },
  {
    slug: "premios-de-calabaza",
    name: "Premios de calabaza",
    category: "premios-entrenamiento",
    short: "Bocaditos suaves de calabaza y avena, ricos en fibra y muy fáciles de partir.",
    description:
      "La calabaza es una aliada natural de la digestión. La mezclamos con avena y la horneamos en bocaditos suaves que se pueden partir con la mano, perfectos para premiar sin excederse.\n\nIdeales para cachorros, perros mayores o mascotas con estómagos sensibles.",
    price: 12900,
    compare: null,
    stock: 60,
    sku: "CAR-PR-002",
    unit: "paquete",
    weight: "100 g",
    pet: "ambos",
    benefits: ["Rica en fibra", "Textura suave", "Fácil de partir", "Apta para cachorros"],
    ingredients: "Calabaza, avena integral, huevo y canela.",
    image: "/images/productos/premios-calabaza.svg",
    featured: false,
    sort: 6,
  },
  {
    slug: "masticable-de-yuca",
    name: "Masticable de yuca",
    category: "masticables",
    short: "Barras de yuca deshidratada, duraderas y sin granos ni aditivos.",
    description:
      "Un masticable vegetal para perros que necesitan algo que dure. La yuca se pela, se corta y se deshidrata lentamente hasta obtener una textura firme que se va ablandando con la saliva.\n\nNo contiene granos, trigo ni conservantes. Supervisa siempre a tu perro mientras mastica y retira el producto cuando quede muy pequeño.",
    price: 15900,
    compare: null,
    stock: 35,
    sku: "CAR-MA-001",
    unit: "paquete",
    weight: "2 unidades",
    pet: "perro",
    benefits: ["Sin granos", "Larga duración", "Origen vegetal", "Ayuda a la masticación"],
    ingredients: "Yuca 100%.",
    image: "/images/productos/masticable-yuca.svg",
    featured: false,
    sort: 7,
  },
  {
    slug: "snack-de-atun-para-gatos",
    name: "Snack de atún para gatos",
    category: "para-gatos",
    short: "Atún al vapor en porciones pequeñas, ideal como premio o para mezclar.",
    description:
      "Atún al vapor, sin sal añadida, en porciones pequeñas que funcionan como premio o como complemento de la comida. Su aroma es irresistible incluso para gatos que suelen ser selectivos.\n\nRecomendamos ofrecerlo como complemento, no como reemplazo de una dieta completa.",
    price: 17900,
    compare: null,
    stock: 26,
    sku: "CAR-GA-001",
    unit: "paquete",
    weight: "70 g",
    pet: "gato",
    benefits: ["Atún al vapor", "Sin sal añadida", "Aroma intenso", "Porciones pequeñas"],
    ingredients: "Atún, agua y aceite de pescado.",
    image: "/images/productos/snack-atun.svg",
    featured: true,
    sort: 8,
  },
  {
    slug: "frutas-deshidratadas",
    name: "Frutas deshidratadas",
    category: "snacks-naturales",
    short: "Mezcla de manzana, naranja y plátano deshidratados, sin azúcar añadida.",
    description:
      "Una mezcla de frutas de temporada deshidratadas a baja temperatura. El resultado es un snack crujiente y natural, sin azúcar añadida ni conservantes.\n\nEs una opción distinta para variar los premios y aportar fibra. Ofrece siempre en porciones moderadas y retira las semillas.",
    price: 13900,
    compare: null,
    stock: 44,
    sku: "CAR-SN-003",
    unit: "paquete",
    weight: "90 g",
    pet: "ambos",
    benefits: ["Sin azúcar añadida", "Fibra natural", "Mezcla de frutas", "Textura crujiente"],
    ingredients: "Manzana, naranja y plátano deshidratados.",
    image: "/images/productos/frutas-deshidratadas.svg",
    featured: false,
    sort: 9,
  },
  {
    slug: "hueso-de-cuero-natural",
    name: "Hueso de cuero natural",
    category: "masticables",
    short: "Cuero de res prensado en forma de hueso, resistente y sin tratamientos químicos.",
    description:
      "Cuero de res natural, prensado y cortado en forma de hueso. Es un masticable resistente que mantiene a los perros entretenidos y ayuda a la limpieza mecánica de los dientes.\n\nNo recibe tratamientos químicos ni blanqueadores. Elige el tamaño adecuado para tu perro y supervisa siempre el momento de la masticación.",
    price: 21900,
    compare: null,
    stock: 20,
    sku: "CAR-MA-002",
    unit: "unidad",
    weight: "1 unidad",
    pet: "perro",
    benefits: ["Cuero natural", "Sin blanqueadores", "Larga duración", "Ayuda dental"],
    ingredients: "Cuero de res 100%.",
    image: "/images/productos/hueso-cuero.svg",
    featured: false,
    sort: 10,
  },
];

const demoOrders = [
  {
    code: "CAR-DEMO01",
    name: "María Fernanda López",
    email: "maria.demo@example.com",
    phone: "+57 310 000 0001",
    delivery: "delivery",
    address: "Carrera 35 # 8A-40, El Poblado",
    city: "Medellín",
    status: "delivered",
    paymentMethod: "nequi",
    paymentStatus: "paid",
    notes: "Dejar en portería si no hay nadie.",
    daysAgo: 18,
    items: [
      ["hueso-de-pollo-desecado", 2],
      ["galletas-de-avena-y-miel", 1],
      ["snack-de-atun-para-gatos", 1],
    ],
    shipping: 0,
  },
  {
    code: "CAR-DEMO02",
    name: "Andrés Felipe Ramírez",
    email: "andres.demo@example.com",
    phone: "+57 310 000 0002",
    delivery: "delivery",
    address: "Carrera 43 # 25-10",
    city: "Medellín",
    status: "shipped",
    paymentMethod: "bancolombia",
    paymentStatus: "unpaid",
    notes: "Enviar por Servientrega.",
    daysAgo: 5,
    items: [
      ["pollo-con-verduras", 1],
      ["chips-de-higado-de-res", 2],
    ],
    shipping: 12000,
  },
  {
    code: "CAR-DEMO03",
    name: "Carolina Gómez",
    email: "carolina.demo@example.com",
    phone: "+57 310 000 0003",
    delivery: "pickup",
    address: "",
    city: "Medellín",
    status: "confirmed",
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    notes: "Recoge el sábado en la mañana.",
    daysAgo: 2,
    items: [
      ["croquetas-de-salmon", 2],
      ["frutas-deshidratadas", 1],
    ],
    shipping: 0,
  },
  {
    code: "CAR-DEMO04",
    name: "Julián Ospina",
    email: "julian.demo@example.com",
    phone: "+57 310 000 0004",
    delivery: "delivery",
    address: "Calle 5 # 8-20, Centro",
    city: "Neiva",
    status: "pending",
    paymentMethod: "transfer",
    paymentStatus: "unpaid",
    notes: "",
    daysAgo: 0,
    items: [
      ["masticable-de-yuca", 1],
      ["hueso-de-cuero-natural", 1],
      ["premios-de-calabaza", 2],
    ],
    shipping: 12000,
  },
];

const demoMessages = [
  {
    name: "Laura Martínez",
    email: "laura.demo@example.com",
    phone: "+57 315 000 0001",
    subject: "Consulta por la comida de pollo",
    message:
      "Hola, tengo un perro de 8 años con estómago sensible. ¿La receta de pollo con verduras sirve como comida completa? ¿Qué porción le daría?",
    status: "new",
    daysAgo: 1,
  },
  {
    name: "Diego Herrera",
    email: "diego.demo@example.com",
    phone: "+57 315 000 0002",
    subject: "Envío a Pereira",
    message:
      "Quiero pedir dos paquetes de croquetas de salmón para mi gata. ¿Cuánto tarda el envío a Pereira y cuánto cuesta?",
    status: "read",
    daysAgo: 4,
  },
];

export async function seed() {
  const client = new Client({ connectionString: databaseUrl(), ssl: sslConfig() });
  await client.connect();

  try {
    await client.query("begin");

    const adminName = process.env.ADMIN_NAME || "Administrador Carnalitos";
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@carnalitos.co").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Carnalitos2026!";
    await client.query(
      `insert into admin_users (name, email, password_hash, role)
       values ($1, $2, $3, 'admin')
       on conflict (email) do update
       set name = excluded.name, password_hash = excluded.password_hash, active = true`,
      [adminName, adminEmail, hashPassword(adminPassword)],
    );
    console.log(`✓ Administrador: ${adminEmail}`);

    const categoryIds = {};
    for (const category of categories) {
      const row = await client.query(
        `insert into categories (slug, name, description, icon, sort_order, active)
         values ($1,$2,$3,$4,$5,true)
         on conflict (slug) do update set
           name = excluded.name,
           description = excluded.description,
           icon = excluded.icon,
           sort_order = excluded.sort_order
         returning id`,
        [category.slug, category.name, category.description, category.icon, category.sort],
      );
      categoryIds[category.slug] = row.rows[0].id;
    }
    console.log(`✓ ${categories.length} categorías`);

    for (const product of products) {
      await client.query(
        `insert into products
          (slug, name, category_id, short_description, description, price, compare_at_price,
           stock, sku, unit, weight, pet_type, benefits, ingredients, image, active, featured, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,$16,$17)
         on conflict (slug) do nothing`,
        [
          product.slug,
          product.name,
          categoryIds[product.category] ?? null,
          product.short,
          product.description,
          product.price,
          product.compare,
          product.stock,
          product.sku,
          product.unit,
          product.weight,
          product.pet,
          product.benefits,
          product.ingredients,
          product.image,
          product.featured,
          product.sort,
        ],
      );
    }
    console.log(`✓ ${products.length} productos`);

    const orderCount = await client.query("select count(*)::int as n from orders");
    if (orderCount.rows[0].n === 0) {
      for (const demo of demoOrders) {
        const itemRows = [];
        for (const [slug, quantity] of demo.items) {
          const row = await client.query(
            "select id, name, price, image from products where slug = $1",
            [slug],
          );
          const product = row.rows[0];
          if (!product) continue;
          itemRows.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
            quantity,
          });
        }
        if (itemRows.length === 0) continue;

        const subtotal = itemRows.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const total = subtotal + demo.shipping;
        const order = await client.query(
          `insert into orders
            (code, customer_name, customer_email, customer_phone, delivery_method,
             address, city, notes, subtotal, shipping, total, status,
             payment_method, payment_status, created_at, updated_at)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
             now() - ($15 || ' days')::interval, now() - ($15 || ' days')::interval)
           on conflict (code) do nothing
           returning id`,
          [
            demo.code,
            demo.name,
            demo.email,
            demo.phone,
            demo.delivery,
            demo.address,
            demo.city,
            demo.notes,
            subtotal,
            demo.shipping,
            total,
            demo.status,
            demo.paymentMethod,
            demo.paymentStatus,
            String(demo.daysAgo),
          ],
        );
        if (!order.rows[0]) continue;
        const orderId = order.rows[0].id;
        for (const item of itemRows) {
          await client.query(
            `insert into order_items (order_id, product_id, product_name, unit_price, quantity, total, image)
             values ($1,$2,$3,$4,$5,$6,$7)`,
            [orderId, item.id, item.name, item.price, item.quantity, item.price * item.quantity, item.image],
          );
        }
      }
      console.log(`✓ ${demoOrders.length} pedidos de ejemplo`);
    } else {
      console.log("· Pedidos existentes: no se crean datos demo");
    }

    const messageCount = await client.query("select count(*)::int as n from contact_messages");
    if (messageCount.rows[0].n === 0) {
      for (const message of demoMessages) {
        await client.query(
          `insert into contact_messages (name, email, phone, subject, message, status, created_at)
           values ($1,$2,$3,$4,$5,$6, now() - ($7 || ' days')::interval)`,
          [
            message.name,
            message.email,
            message.phone,
            message.subject,
            message.message,
            message.status,
            String(message.daysAgo),
          ],
        );
      }
      console.log(`✓ ${demoMessages.length} mensajes de ejemplo`);
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await seed();
  console.log("✓ Datos iniciales cargados");
}
