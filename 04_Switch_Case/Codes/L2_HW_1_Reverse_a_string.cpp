#include <iostream>
using namespace std;

int main() {
    string text = "hello";
    string reversed = "";

    for (int i = text.length() - 1; i >= 0; i--) {
        reversed += text[i];
    }

    cout << "Original: " << text << endl;
    cout << "Reversed: " << reversed << endl;
    return 0;
}
