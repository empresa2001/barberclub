import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BarberBookPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-col items-center justify-center min-h-[60vh] py-8">
        <h1 className="text-2xl font-bold">hola soy un barbero</h1>
      </main>
      <Footer />
    </>
  );
}
