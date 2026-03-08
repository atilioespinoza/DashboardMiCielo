import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Asegurarse de que exista la API Key
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
    try {
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY no está configurada.' },
                { status: 500 }
            );
        }

        const { niche } = await req.json();

        if (!niche) {
            return NextResponse.json(
                { error: 'El nicho es requerido.' },
                { status: 400 }
            );
        }

        const prompt = `
      Actúa como el "Analista de Tendencias Multicanal", un experto de clase mundial en e-commerce, dropshipping e importación, con la habilidad de cruzar datos de múltiples plataformas (TikTok, Instagram, AliExpress, Mercado Libre, Foros/Reddit y Aduanas).

      El usuario está buscando ideas de productos ganadores para el siguiente nicho, problema o categoría: "${niche}".

      TU MISIÓN:
      Sugiere exactamente 3 ideas de productos altamente rentables y escalables dentro de esa categoría.
      Para cada producto, debes realizar un análisis minucioso considerando los siguientes 5 pilares, simulando tener información reciente de estas plataformas:

      1. Potencial Viral (TikTok/IG): Evalúa el factor "wow", demostrabilidad y atractivo visual.
      2. Disponibilidad y Costos (AliExpress/Origen): Estima el costo en origen e identifica de dónde provendría.
      3. Competencia Local (Mercado Libre/Otros): Evalúa la saturación actual del mercado y un precio estimado de reventa viable.
      4. Audiencia Orgánica (Foros/Reddit): ¿Existe una comunidad apasionada que hable de este problema o producto?
      5. Logística e Importación (Aduanas): Evalúa peso, volumen y posibles restricciones legales o aduaneras (ej. baterías, líquidos).

      FORMATO DE SALIDA:
      Debes responder ÚNICAMENTE con un objeto JSON válido. No uses Markdown \`\`\`json ni agregues texto explicativo antes o después del JSON. El formato exacto debe ser el siguiente:

      {
        "products": [
          {
            "id": "prod_1",
            "name": "Nombre Atractivo del Producto",
            "description": "Breve descripción de qué es y qué problema resuelve de forma única.",
            "viralPotential": {
              "score": 8,
              "reason": "Corto argumento sobre su factor wow visual."
            },
            "costAndAvailability": {
              "estimatedCost": "$X.XX USD",
              "source": "Ej. AliExpress / Fabricante Privado"
            },
            "localCompetition": {
              "saturationLevel": "Baja/Media/Alta",
              "estimatedResale": "$YY.YY CLP"
            },
            "organicAudience": {
              "communities": "Ej. r/skincareaddiction, Grupos de FB",
              "demand": "Alta debido a..."
            },
            "logistics": {
              "considerations": "Ej. Producto ligero, sin restricciones de batería."
            },
            "overallRecommendation": "Un resumen ejecutivo de por qué deberías vender esto AHORA."
          }
        ]
      }
    `;

        // Usamos el modelo flash-preview
        const model = genAI.getGenerativeModel({
            model: 'gemini-3-flash-preview',
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        try {
            const parsedData = JSON.parse(responseText);
            return NextResponse.json(parsedData);
        } catch (parseError) {
            console.error('Error parsing JSON from Gemini:', responseText);
            return NextResponse.json(
                { error: 'La IA devolvió un formato inválido. Por favor intenta de nuevo.' },
                { status: 500 }
            );
        }

    } catch (error: any) {
        console.error('Error in Product Finder API:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor al procesar tu solicitud.' },
            { status: 500 }
        );
    }
}
