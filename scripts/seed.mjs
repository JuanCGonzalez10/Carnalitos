import { Client } from "pg";
import { scryptSync, randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { databaseUrl, sslConfig } from "./db-config.mjs";

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const glampings = [
  {
    slug: "domo-mirador-del-canon",
    name: "Domo Mirador del Cañón",
    tagline: "Amanecer frente a la inmensidad",
    short_description:
      "Un domo geodésico con ventanal panorámico para dormir mirando las luces del cañón.",
    description:
      "Despierta con el cañón iluminándose lentamente. El Domo Mirador combina la sensación de acampar con el confort de una habitación boutique: cama king, textiles cálidos, terraza privada y una ventana enorme que convierte el paisaje en parte de la habitación.\n\nAl caer la noche, la fogata y el cielo abierto completan una experiencia pensada para desconectar. Es ideal para parejas que buscan aventura sin renunciar al descanso.",
    price: 420000,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    size: 28,
    amenities: ["Cama king", "Baño privado", "Terraza panorámica", "Fogata exterior", "Wi-Fi", "Cafetera", "Amenities de baño", "Ropa de cama premium"],
    includes: ["Desayuno campestre", "Caminata guiada al mirador", "Parqueadero privado"],
    conditions: "Tarifa para 2 personas. No se permiten mascotas en este alojamiento. Check-in 3:00 p. m. / check-out 12:00 m.",
    image: "/images/glamping-domos.jpg",
    featured: true,
    sort: 1,
    gallery: [
      ["/images/glamping-domos.jpg", "Domo geodésico entre montañas"],
      ["/images/glamping-interior.jpg", "Interior del domo con cama king"],
      ["/images/gal-noche.jpg", "Cielo nocturno visto desde el domo"],
    ],
  },
  {
    slug: "cabana-rio-magdalena",
    name: "Cabaña Río Magdalena",
    tagline: "El sonido del agua como banda sonora",
    short_description:
      "Cabaña de madera con terraza, hamacas y acceso a una zona privada del río.",
    description:
      "Una cabaña amplia y fresca, construida con maderas locales y abierta al sonido del río. Tiene dos habitaciones, cocina equipada, terraza con hamacas y un sendero corto que lleva a la zona de río.\n\nEs el alojamiento perfecto para familias y grupos pequeños que quieren combinar descanso, naturaleza y actividades de aventura. La luz de la mañana entra por los ventanales y la tarde se disfruta alrededor de la fogata.",
    price: 560000,
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    size: 52,
    amenities: ["Dos habitaciones", "Cocina equipada", "Terraza con hamacas", "Baño privado", "Wi-Fi", "Nevera", "Zona de fogata", "Acceso a zona de río"],
    includes: ["Desayuno campestre para 4", "Kit de fogata", "Parqueadero privado"],
    conditions: "Tarifa para 4 personas. Máximo 2 personas adicionales con costo de $60.000 por persona/noche. Mascotas permitidas con aviso previo.",
    image: "/images/glamping-rio.jpg",
    featured: true,
    sort: 2,
    gallery: [
      ["/images/glamping-rio.jpg", "Cabaña junto al río"],
      ["/images/glamping-fogata.jpg", "Zona de fogata al atardecer"],
      ["/images/glamping-interior2.jpg", "Habitación principal de la cabaña"],
    ],
  },
  {
    slug: "safari-bosque-nublado",
    name: "Safari Bosque Nublado",
    tagline: "Dormir dentro del bosque",
    short_description:
      "Carpa safari elevada con ducha exterior, caldero y vistas al bosque nublado.",
    description:
      "Una carpa safari elevada, rodeada de árboles y niebla. El Safari Bosque Nublado tiene cama king, sala pequeña, terraza con caldero exterior y una ducha al aire libre para vivir el bosque con todos los sentidos.\n\nPensado para parejas y viajeros que buscan una experiencia íntima, silenciosa y profundamente natural. Al amanecer, el canto de las aves y la neblina entre los árboles marcan el ritmo del día.",
    price: 680000,
    capacity: 4,
    bedrooms: 1,
    bathrooms: 1,
    size: 45,
    amenities: ["Cama king + sofá cama", "Ducha exterior", "Terraza privada", "Caldero exterior", "Mirador", "Wi-Fi", "Desayuno incluido", "Iluminación cálida"],
    includes: ["Desayuno campestre", "Avistamiento de aves guiado", "Kit de fogata", "Parqueadero privado"],
    conditions: "Tarifa para 2 personas; el sofá cama permite hasta 4. Menores de 8 años no pueden participar en las actividades de altura.",
    image: "/images/glamping-bosque.jpg",
    featured: true,
    sort: 3,
    gallery: [
      ["/images/glamping-bosque.jpg", "Carpa safari en el bosque"],
      ["/images/glamping-lujo.jpg", "Terraza con vista al bosque"],
      ["/images/gal-atardecer.jpg", "Atardecer desde el mirador"],
    ],
  },
  {
    slug: "suite-del-canon",
    name: "Suite del Cañón",
    tagline: "Glamping de autor con jacuzzi privado",
    short_description:
      "La opción más exclusiva: jacuzzi privado, terraza y vista abierta al cañón.",
    description:
      "Para quienes quieren celebrar algo especial. La Suite del Cañón ofrece jacuzzi privado, cama king, minibar, terraza con mobiliario de descanso y una vista abierta al cañón que cambia con la luz del día.\n\nEl servicio incluye desayuno servido en la terraza y una atención personalizada para organizar detalles, celebraciones o una escapada sin preocupaciones.",
    price: 890000,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    size: 60,
    amenities: ["Jacuzzi privado", "Cama king", "Terraza", "Vista al cañón", "Minibar", "Wi-Fi", "Servicio a la habitación", "Desayuno en la terraza"],
    includes: ["Desayuno servido en la terraza", "Botella de vino de bienvenida", "Decoración básica de celebración", "Parqueadero privado"],
    conditions: "Tarifa para 2 personas. Celebración o decoración especial sujeta a disponibilidad y costo adicional. Prohibido fumar en la suite.",
    image: "/images/glamping-lujo.jpg",
    featured: true,
    sort: 4,
    gallery: [
      ["/images/glamping-lujo.jpg", "Suite con terraza y vista al cañón"],
      ["/images/glamping-interior2.jpg", "Detalle de la habitación"],
      ["/images/gal-piscina.jpg", "Zona de descanso y jacuzzi"],
    ],
  },
  {
    slug: "refugio-fogata",
    name: "Refugio Fogata",
    tagline: "Lo esencial, bien hecho",
    short_description:
      "Un refugio cálido y sencillo para viajeros que buscan naturaleza y buena compañía.",
    description:
      "Un espacio compacto, cálido y funcional para quienes prefieren pasar más tiempo afuera. Cama doble, baño privado, hamaca y una zona de fogata compartida con vista a las montañas.\n\nEs la puerta de entrada a las actividades de aventura y una excelente opción para viajeros solos o parejas que quieren una escapada sin complicaciones.",
    price: 380000,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    size: 24,
    amenities: ["Cama doble", "Baño privado", "Zona de fogata", "Hamaca", "Wi-Fi", "Desayuno incluido", "Ventilación natural"],
    includes: ["Desayuno campestre", "Kit de fogata", "Parqueadero privado"],
    conditions: "Tarifa para 2 personas. Alojamiento sin aire acondicionado; la temperatura del cañón es fresca en la noche.",
    image: "/images/glamping-fogata.jpg",
    featured: false,
    sort: 5,
    gallery: [
      ["/images/glamping-fogata.jpg", "Refugio con zona de fogata"],
      ["/images/glamping-interior.jpg", "Interior cálido del refugio"],
      ["/images/hero-grupo.jpg", "Aventura en el cañón"],
    ],
  },
];

const activities = [
  {
    slug: "rafting-rio-magdalena",
    name: "Rafting Río Magdalena",
    category: "Agua",
    short: "Desciende los rápidos del Magdalena con guías certificados y todo el equipo de seguridad.",
    description:
      "Una experiencia de adrenalina pura en el río Magdalena. Después de una charla de seguridad y una práctica corta, salimos al agua para descender los rápidos acompañados por guías especializados. La actividad incluye casco, chaleco, remo y traje de neopreno cuando el clima lo requiere.\n\nNo necesitas experiencia previa. El nivel del río y el tramo se ajustan a las condiciones del día para priorizar la seguridad del grupo.",
    price: 180000,
    unit: "persona",
    duration: "2.5 horas",
    difficulty: "Alta",
    age: 12,
    max: 10,
    includes: ["Guía certificado", "Equipo de seguridad", "Charla técnica", "Hidratación", "Fotografía grupal"],
    requirements: "Saber nadar, no tener lesiones recientes y firmar consentimiento informado.",
    image: "/images/act-rafting.jpg",
    featured: true,
    sort: 1,
  },
  {
    slug: "escalada-en-roca",
    name: "Escalada en Roca",
    category: "Altura",
    short: "Aprende las bases de la escalada en una pared natural con supervisión profesional.",
    description:
      "Una introducción real a la escalada en roca. El equipo revisa el equipo, explica los nudos y las técnicas básicas, y acompaña cada ascenso desde la base. La pared se elige según el nivel del grupo.\n\nLa actividad está diseñada para principiantes y para quienes ya escalan y quieren conocer nuevas rutas. Todo el equipo técnico está incluido.",
    price: 150000,
    unit: "persona",
    duration: "3 horas",
    difficulty: "Alta",
    age: 10,
    max: 8,
    includes: ["Guía de escalada", "Arnés, casco y cuerda", "Charla técnica", "Hidratación"],
    requirements: "Ropa cómoda, calzado deportivo y buena condición física básica.",
    image: "/images/act-escalada.jpg",
    featured: true,
    sort: 2,
  },
  {
    slug: "cascada-escondida",
    name: "Cascada Escondida",
    category: "Naturaleza",
    short: "Caminata entre bosque y quebradas hasta una cascada de agua fría y cristalina.",
    description:
      "Una caminata guiada que sale desde el área de glamping y entra al bosque por senderos de sombra. El destino es una cascada escondida, ideal para un baño refrescante y un descanso con vista.\n\nEl recorrido es de dificultad media y se adapta al ritmo del grupo. Lleva ropa que se pueda mojar y calzado con agarre.",
    price: 120000,
    unit: "persona",
    duration: "4 horas",
    difficulty: "Media",
    age: 8,
    max: 12,
    includes: ["Guía local", "Entrada a la cascada", "Snack de fruta", "Bastón de caminata"],
    requirements: "Calzado con agarre, ropa de cambio y protector solar.",
    image: "/images/act-cascada.jpg",
    featured: true,
    sort: 3,
  },
  {
    slug: "cabalgata-al-atardecer",
    name: "Cabalgata al Atardecer",
    category: "Campo",
    short: "Recorre los caminos del cañón a caballo y termina con el cielo encendido.",
    description:
      "Una cabalgata tranquila por caminos rurales, guiada por arrieros de la zona. El recorrido se ajusta al nivel de los participantes y termina en un mirador para ver el atardecer sobre el cañón.\n\nEs una actividad ideal para familias y para quienes prefieren una aventura suave. Los caballos y el equipo se asignan según la experiencia de cada persona.",
    price: 140000,
    unit: "persona",
    duration: "2 horas",
    difficulty: "Baja",
    age: 6,
    max: 8,
    includes: ["Caballo y montura", "Arriero guía", "Casco", "Hidratación"],
    requirements: "Peso máximo 100 kg. Menores acompañados por un adulto.",
    image: "/images/act-cabalgata.jpg",
    featured: false,
    sort: 4,
  },
  {
    slug: "senderismo-mirador",
    name: "Senderismo al Mirador",
    category: "Naturaleza",
    short: "Sube al punto más alto de la finca y entiende la escala del cañón.",
    description:
      "Un sendero de ascenso progresivo hasta el mirador principal. En el camino, el guía comparte historias sobre el bosque, el río y las comunidades del cañón. Arriba, el paisaje abierto recompensa el esfuerzo.\n\nLa caminata es de dificultad media y se realiza temprano para aprovechar la luz y el clima fresco.",
    price: 90000,
    unit: "persona",
    duration: "3 horas",
    difficulty: "Media",
    age: 6,
    max: 15,
    includes: ["Guía local", "Bastón de caminata", "Snack", "Hidratación"],
    requirements: "Calzado deportivo, gorra y protector solar.",
    image: "/images/act-senderismo.jpg",
    featured: true,
    sort: 5,
  },
  {
    slug: "avistamiento-de-aves",
    name: "Avistamiento de Aves",
    category: "Naturaleza",
    short: "Salida de madrugada con binoculares para descubrir las aves del bosque nublado.",
    description:
      "Una salida tranquila al amanecer, cuando el bosque está más activo. Con binoculares y la guía de un conocedor local, identificamos especies del bosque nublado y aprendemos a escuchar el paisaje.\n\nNo se requiere experiencia. La actividad es de bajo impacto y respeta los senderos y las distancias de observación.",
    price: 110000,
    unit: "persona",
    duration: "2.5 horas",
    difficulty: "Baja",
    age: 5,
    max: 10,
    includes: ["Guía especializado", "Binoculares", "Café de bienvenida", "Lista de especies"],
    requirements: "Ropa de abrigo, silencio y paciencia.",
    image: "/images/act-avistamiento.jpg",
    featured: false,
    sort: 6,
  },
  {
    slug: "caminata-nocturna",
    name: "Caminata Nocturna",
    category: "Naturaleza",
    short: "Descubre el bosque de noche: sonidos, luciérnagas y cielo abierto.",
    description:
      "Una caminata corta y guiada por senderos seguros para conocer el bosque cuando cae la noche. Escuchamos insectos y aves nocturnas, observamos el cielo y aprendemos a movernos sin alterar el entorno.\n\nLa actividad termina alrededor de una fogata con chocolate caliente. Es una experiencia perfecta para cerrar el día.",
    price: 80000,
    unit: "persona",
    duration: "2 horas",
    difficulty: "Baja",
    age: 8,
    max: 12,
    includes: ["Guía local", "Linterna", "Chocolate caliente", "Fogata"],
    requirements: "Calzado cerrado y chaqueta abrigada.",
    image: "/images/act-caminata.jpg",
    featured: false,
    sort: 7,
  },
];

const services = [
  ["Desayuno campestre adicional", "Fruta, huevos al gusto, pan artesanal, café del Huila y jugo natural.", 35000, "persona", "/images/serv-desayuno.jpg", 1],
  ["Transporte desde Neiva", "Recogida y regreso en vehículo privado para hasta 4 personas. Sujeto a disponibilidad.", 280000, "grupo", "/images/serv-transporte.jpg", 2],
  ["Sesión de fotografía", "Una hora de fotografía editorial en los espacios del glamping. Incluye 15 fotos editadas.", 320000, "sesión", "/images/serv-fotografia.jpg", 3],
  ["Fogata con marshmallows", "Fogata preparada, sillas, mantas y kit de marshmallows para el grupo.", 60000, "grupo", "/images/glamping-fogata.jpg", 4],
  ["Decoración romántica", "Pétalos, velas LED, globos y mensaje personalizado en el alojamiento.", 180000, "servicio", "/images/glamping-lujo.jpg", 5],
  ["Late checkout", "Extiende la salida hasta las 3:00 p. m., sujeto a disponibilidad del alojamiento.", 50000, "servicio", "/images/glamping-interior.jpg", 6],
];

const gallery = [
  ["/images/hero-canon.jpg", "El cañón al amanecer", "Paisaje"],
  ["/images/hero-grupo.jpg", "Aventura en grupo", "Aventura"],
  ["/images/glamping-domos.jpg", "Domo Mirador del Cañón", "Glamping"],
  ["/images/glamping-rio.jpg", "Cabaña Río Magdalena", "Glamping"],
  ["/images/glamping-bosque.jpg", "Safari Bosque Nublado", "Glamping"],
  ["/images/glamping-lujo.jpg", "Suite del Cañón", "Glamping"],
  ["/images/glamping-fogata.jpg", "Refugio Fogata", "Glamping"],
  ["/images/glamping-interior.jpg", "Interiores con textiles cálidos", "Detalles"],
  ["/images/glamping-interior2.jpg", "Habitación principal", "Detalles"],
  ["/images/act-rafting.jpg", "Rafting en el Magdalena", "Aventura"],
  ["/images/act-escalada.jpg", "Escalada en roca", "Aventura"],
  ["/images/act-cascada.jpg", "Cascada escondida", "Naturaleza"],
  ["/images/act-cabalgata.jpg", "Cabalgata al atardecer", "Aventura"],
  ["/images/act-senderismo.jpg", "Senderismo al mirador", "Naturaleza"],
  ["/images/act-avistamiento.jpg", "Avistamiento de aves", "Naturaleza"],
  ["/images/gal-atardecer.jpg", "Atardecer sobre el cañón", "Paisaje"],
  ["/images/gal-noche.jpg", "Cielo nocturno", "Paisaje"],
  ["/images/gal-piscina.jpg", "Zona de descanso", "Glamping"],
  ["/images/gal-canon.jpg", "Formaciones del cañón", "Paisaje"],
  ["/images/gal-desierto.jpg", "Senderos abiertos", "Paisaje"],
];

export async function seed() {
  const client = new Client({ connectionString: databaseUrl(), ssl: sslConfig() });
  await client.connect();

  try {
    await client.query("begin");

    const adminName = process.env.ADMIN_NAME || "Administrador";
    const adminEmail = (process.env.ADMIN_EMAIL || "admin@adrenalinaextrema.co").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Adrenalina2026!";
    await client.query(
      `insert into admin_users (name, email, password_hash, role)
       values ($1, $2, $3, 'admin')
       on conflict (email) do update
       set name = excluded.name, password_hash = excluded.password_hash, active = true`,
      [adminName, adminEmail, hashPassword(adminPassword)],
    );
    console.log(`✓ Administrador: ${adminEmail}`);

    for (const g of glampings) {
      const weekend = g.weekend ?? Math.round((g.price * 1.15) / 1000) * 1000;
      const holiday = g.holiday ?? Math.round((g.price * 1.25) / 1000) * 1000;
      const existing = await client.query("select id from glampings where slug = $1", [g.slug]);
      let id = existing.rows[0]?.id;
      if (!id) {
        const inserted = await client.query(
          `insert into glampings
            (slug, name, tagline, short_description, description, price_per_night,
             weekend_price_per_night, holiday_price_per_night, capacity,
             bedrooms, bathrooms, size_m2, amenities, includes, conditions, location, main_image,
             active, featured, sort_order)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,true,$18,$19)
           returning id`,
          [
            g.slug, g.name, g.tagline, g.short_description, g.description, g.price,
            weekend, holiday, g.capacity,
            g.bedrooms, g.bathrooms, g.size, g.amenities, g.includes, g.conditions,
            "Cañón del Magdalena, Huila", g.image, g.featured, g.sort,
          ],
        );
        id = inserted.rows[0].id;
      } else {
        // Para filas existentes calculamos el valor sugerido a partir del precio
        // actual en la base de datos (el administrador pudo haberlo cambiado).
        // No sobrescribe tarifas ya configuradas.
        await client.query(
          `update glampings set
             weekend_price_per_night = coalesce(weekend_price_per_night, round(price_per_night * 1.15 / 1000) * 1000),
             holiday_price_per_night = coalesce(holiday_price_per_night, round(price_per_night * 1.25 / 1000) * 1000)
           where id = $1`,
          [id],
        );
      }

      const imageCount = await client.query("select count(*)::int as n from glamping_images where glamping_id = $1", [id]);
      if (imageCount.rows[0].n === 0) {
        for (let i = 0; i < g.gallery.length; i++) {
          const [url, alt] = g.gallery[i];
          await client.query(
            `insert into glamping_images (glamping_id, url, alt, sort_order, is_main)
             values ($1,$2,$3,$4,$5)`,
            [id, url, alt, i, i === 0],
          );
        }
      }
    }
    console.log(`✓ ${glampings.length} glampings`);

    for (const a of activities) {
      const weekend = a.weekend ?? Math.round((a.price * 1.1) / 1000) * 1000;
      const holiday = a.holiday ?? Math.round((a.price * 1.2) / 1000) * 1000;
      await client.query(
        `insert into activities
          (slug, name, category, short_description, description, price,
           weekend_price, holiday_price, price_unit, duration,
           difficulty, min_age, max_people, includes, requirements, image, active, featured, sort_order)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17,$18)
         on conflict (slug) do update set
           name = excluded.name, category = excluded.category, short_description = excluded.short_description,
           description = excluded.description, price = excluded.price,
           weekend_price = coalesce(activities.weekend_price, round(excluded.price * 1.1 / 1000) * 1000),
           holiday_price = coalesce(activities.holiday_price, round(excluded.price * 1.2 / 1000) * 1000),
           duration = excluded.duration,
           difficulty = excluded.difficulty, min_age = excluded.min_age, max_people = excluded.max_people,
           includes = excluded.includes, requirements = excluded.requirements, image = excluded.image,
           featured = excluded.featured, sort_order = excluded.sort_order`,
        [
          a.slug, a.name, a.category, a.short, a.description, a.price,
          weekend, holiday, a.unit, a.duration,
          a.difficulty, a.age, a.max, a.includes, a.requirements, a.image, a.featured, a.sort,
        ],
      );
    }
    console.log(`✓ ${activities.length} actividades`);

    const serviceCount = await client.query("select count(*)::int as n from services");
    if (serviceCount.rows[0].n === 0) {
      for (const [name, description, price, unit, image, sort] of services) {
        await client.query(
          `insert into services (name, description, price, price_unit, image, sort_order)
           values ($1,$2,$3,$4,$5,$6)`,
          [name, description, price, unit, image, sort],
        );
      }
    }
    console.log(`✓ ${services.length} servicios`);

    const galleryCount = await client.query("select count(*)::int as n from gallery_images");
    if (galleryCount.rows[0].n === 0) {
      for (let i = 0; i < gallery.length; i++) {
        const [url, alt, category] = gallery[i];
        await client.query(
          "insert into gallery_images (url, alt, category, sort_order) values ($1,$2,$3,$4)",
          [url, alt, category, i],
        );
      }
    }
    console.log(`✓ ${gallery.length} imágenes de galería`);

    // Tarifa de temporada de ejemplo (diciembre próximo)
    const rateCount = await client.query("select count(*)::int as n from glamping_rates");
    if (rateCount.rows[0].n === 0) {
      const year = new Date().getFullYear();
      const start = `${year}-12-20`;
      const end = `${year + 1}-01-10`;
      await client.query(
        `insert into glamping_rates (glamping_id, name, start_date, end_date, price_per_night, min_nights)
         select id, 'Temporada alta', $1, $2, round(price_per_night * 1.2), 2 from glampings where active = true`,
        [start, end],
      );
    }

    // Reservas de ejemplo para que el panel tenga información desde el primer arranque
    const bookingCount = await client.query("select count(*)::int as n from bookings");
    if (bookingCount.rows[0].n === 0) {
      const g = await client.query("select id, slug, price_per_night from glampings order by sort_order");
      const bySlug = Object.fromEntries(g.rows.map((r) => [r.slug, r]));
      const a = await client.query("select id, name, price from activities order by sort_order limit 3");

      const demos = [
        {
          code: "AEH-DEMO01",
          glamping: bySlug["domo-mirador-del-canon"],
          name: "María Fernanda López",
          email: "maria.demo@example.com",
          phone: "+57 310 000 0001",
          city: "Neiva",
          offsetIn: 12,
          offsetOut: 14,
          guests: 2,
          status: "confirmed",
          payment: "deposit",
          source: "web",
        },
        {
          code: "AEH-DEMO02",
          glamping: bySlug["cabana-rio-magdalena"],
          name: "Andrés Felipe Ramírez",
          email: "andres.demo@example.com",
          phone: "+57 310 000 0002",
          city: "Bogotá",
          offsetIn: 24,
          offsetOut: 27,
          guests: 4,
          status: "pending",
          payment: "none",
          source: "whatsapp",
        },
        {
          code: "AEH-DEMO03",
          glamping: bySlug["suite-del-canon"],
          name: "Carolina Gómez",
          email: "carolina.demo@example.com",
          phone: "+57 310 000 0003",
          city: "Cali",
          offsetIn: -22,
          offsetOut: -20,
          guests: 2,
          status: "completed",
          payment: "full",
          source: "web",
        },
      ];

      for (const d of demos) {
        if (!d.glamping) continue;
        const nights = d.offsetOut - d.offsetIn;
        const nightly = Number(d.glamping.price_per_night);
        const subtotal = nights * nightly;
        const activitiesTotal = d.status === "pending" ? 0 : 180000 * d.guests;
        const total = subtotal + activitiesTotal;
        const deposit = Math.round(total * 0.3 / 100) * 100;
        const paid = d.payment === "full" ? total : d.payment === "deposit" ? deposit : 0;
        const paymentStatus = d.payment === "full" ? "paid" : d.payment === "deposit" ? "deposit_paid" : "unpaid";

        const customer = await client.query(
          `insert into customers (full_name, email, phone, city)
           values ($1,$2,$3,$4)
           on conflict (lower(email)) where email <> '' do update set full_name = excluded.full_name, phone = excluded.phone
           returning id`,
          [d.name, d.email, d.phone, d.city],
        );

        const booking = await client.query(
          `insert into bookings
            (code, customer_id, glamping_id, guest_name, guest_email, guest_phone, guest_city,
             check_in, check_out, guests, nights, nightly_rate, subtotal, activities_total,
             services_total, total, deposit_required, paid_amount, balance, status, payment_status,
             source, notes, created_at)
           values ($1,$2,$3,$4,$5,$6,$7,
             current_date + $8::int, current_date + $9::int, $10,$11,$12,$13,$14,0,$15,$16,$17,$18,$19,$20,$21,$22,
             case when $23 = 'completed' then now() - interval '30 days' else now() - interval '3 days' end)
           on conflict (code) do nothing
           returning id`,
          [
            d.code, customer.rows[0].id, d.glamping.id, d.name, d.email, d.phone, d.city,
            d.offsetIn, d.offsetOut, d.guests, nights, nightly, subtotal, activitiesTotal,
            total, deposit, paid, total - paid, d.status, paymentStatus, d.source,
            d.status === "pending" ? "Solicitud creada desde WhatsApp; confirmar disponibilidad y anticipo." : "",
            d.status,
          ],
        );

        if (booking.rowCount && activitiesTotal > 0) {
          await client.query(
            `insert into booking_activities (booking_id, activity_id, activity_name, quantity, unit_price, total)
             values ($1,$2,$3,$4,$5,$6)`,
            [booking.rows[0].id, a.rows[0].id, a.rows[0].name, d.guests, 180000, activitiesTotal],
          );
        }

        if (booking.rowCount && paid > 0) {
          await client.query(
            `insert into payments (booking_id, amount, method, reference, status, paid_at, notes, created_by)
             values ($1,$2,'nequi','DEMO-' || $3,'approved', current_date - 2, 'Pago de ejemplo', 'seed')`,
            [booking.rows[0].id, paid, d.code],
          );
        }
      }
      console.log("✓ Reservas de ejemplo creadas");
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
