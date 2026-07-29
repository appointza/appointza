namespace appointza.Models

{
    public class ActionRes<T>
    {
        public T item { get; set; } 
        public string error { get; set; }
    }
}
