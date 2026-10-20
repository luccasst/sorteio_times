import { Link, NavLink } from "react-router-dom";

const ITENS = [
  { para: "/", rotulo: "Sorteio", fim: true },
  { para: "/blog", rotulo: "Blog" },
  { para: "/sobre", rotulo: "Sobre" },
  { para: "/contato", rotulo: "Contato" },
];

export default function Menu() {
  return (
    <nav className="menu-topo" aria-label="Menu principal">
      {ITENS.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          end={item.fim}
          className={({ isActive }) => (isActive ? "menu-link ativo" : "menu-link")}
        >
          {item.rotulo}
        </NavLink>
      ))}
      <Link to="/sorteios" className="menu-link destaque">
        Meus Sorteios
      </Link>
    </nav>
  );
}
