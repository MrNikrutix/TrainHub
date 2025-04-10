export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to my website!</h1>
        <p className="max-w-md text-lg leading-relaxed">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod,
          justo nec luctus tristique, nisl metus faucibus leo, ut aliquet tellus
          enim et quam.
        </p>
      </main>
    </div>
  );
}
