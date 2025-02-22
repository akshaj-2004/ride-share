import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

export async function POST(req: NextRequest) {
    try {
        const { amount, paymentMethod } = await req.json();

        if (paymentMethod === "stripe") {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100, 
                currency: "usd",
                payment_method_types: ["card"],
            });

            return NextResponse.json({ clientSecret: paymentIntent.client_secret });
        } else {
            return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}